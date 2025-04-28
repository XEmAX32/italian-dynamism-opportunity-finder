import * as mod from "https://deno.land/std@0.213.0/dotenv/mod.ts";
import { Client } from "npm:@notionhq/client";
import {
  storageContextFromDefaults,
  Document,
  VectorStoreIndex,
  QueryEngineTool
} from "npm:llamaindex@0.3.14";

const keys = await mod.load({export:true})

const PERSISTED_STORAGE_LOCATION = './storage'

async function getVectorTool() {
  /* Notion setup */
  const notion = new Client({ auth: keys.NOTION_SECRET_KEY });
  const pages = await notion.databases.query({ 
    database_id: keys.DATABASE_ID, 
    filter: {
      property: 'description',
      "rich_text": {
        "is_not_empty": true
      },
    },
  });

  const storageContext = await storageContextFromDefaults({
    persistDir: PERSISTED_STORAGE_LOCATION
  });

  const documents = pages.results.map((page) => new Document({ 
    title: page.properties["Name"]["title"][0]['text']['content'],
    text: `
      DESCRIPTION OF THE OPPORTUNITY:
      ${page.properties['description']['rich_text'][0]['text']['content']}\n\n
      ---------\n\n
      DESCRIPTION OF THE OPPORTUNITY'S ORGANISER:
      ${page.properties['organisationDescription']['rich_text'].length > 0 && page.properties['organisationDescription']['rich_text'][0]['text']['content']}\n\n
      ---------\n\n
      DESCRIPTION OF THE IDEAL CANDIDATE:
      ${page.properties['idealCandidate']['rich_text'].length > 0 && page.properties['idealCandidate']['rich_text'][0]['text']['content']}\n\n
      ---------\n\n
      DESCRIPTION OF THE APPLICATION PROCESS:
      ${page.properties['howTo']['rich_text'].length > 0 && page.properties['howTo']['rich_text'][0]['text']['content']}\n\n
      ---------\n\n
      LINK:
      ${page.properties['website']['rich_text'].length > 0 && page.properties['website']['rich_text'][0]['text']['content']}\n\n
      ---------\n\n
    ` 
  }))

  // const index = await VectorStoreIndex.fromDocuments(documents, { storageContext })

  const index = await VectorStoreIndex.fromDocuments(documents)


  const retriever = await index.asRetriever();
  retriever.similarityTopK = 10;

  const queryEngine = await index.asQueryEngine({
    retriever,
  });

  return new QueryEngineTool({
    queryEngine: queryEngine,
    metadata: {
      name: "opportunity_list_tool",
      description: "This tool can help you suggest opportunities to the user",
    },
  });
}

export { getVectorTool };