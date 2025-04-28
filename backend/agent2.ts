console.log('yo')
import * as mod from "https://deno.land/std@0.213.0/dotenv/mod.ts";
import { Client } from "npm:@notionhq/client";

import { ChatOpenAI, OpenAIEmbeddings } from "npm:@langchain/openai";
import { HumanMessage } from "npm:@langchain/core/messages";
import { Document } from "npm:langchain/document";
import { formatDocumentsAsString } from "npm:langchain/util/document";
import { MemoryVectorStore } from "npm:langchain/vectorstores/memory";
import { PromptTemplate } from "npm:@langchain/core/prompts";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "npm:@langchain/core/runnables";
import { StringOutputParser } from "npm:@langchain/core/output_parsers";

const keys = await mod.load({export:true})

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

const docs = pages.results.map((page, index) => new Document({ 
  pageContent: `
    TITLE:
    ${page.properties["Name"]["title"][0]['text']['content']}\n\n
    DESCRIPTION OF THE OPPORTUNITY:
      ${page.properties['description']['rich_text'][0]['text']['content']}\n\n
    `, 
    metadata: { source: index }
  })
);

const model = new ChatOpenAI({});

const vectorStore = await MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings());
const retriever = vectorStore.asRetriever();

const prompt = PromptTemplate.fromTemplate(`Answer the question based only on the following context:
{context}

Question: {question}`);

const chain = RunnableSequence.from([
  {
    context: retriever.pipe(formatDocumentsAsString),
    question: new RunnablePassthrough(),
  },
  prompt,
  model,
  new StringOutputParser(),
]);

const result = await chain.invoke("MLH?");

console.log(result);

// const vectorStore = await MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings());
// const retriever = vectorStore.asRetriever();

// const chain = RunnableSequence.from([
//   {
//     context: retriever.pipe(formatDocumentsAsString),
//     question: new RunnablePassthrough(),
//   },
//   prompt,
//   model,
//   new StringOutputParser(),
// ]);

// const result = await chain.invoke("Major League Hacking");

// console.dir(result);

// const res = async () => {
//   return retriever.getRelevantDocuments("mlh");

// }
// console.log(await res())

// const model = new ChatOpenAI({
//   model: "gpt-4",
//   temperature: 0.9,
//   apiKey: keys.OPENAI_API_KEY, // In Node.js defaults to process.env.OPENAI_API_KEY
// }).bind({
//   response_format: {
//     type: "json_object",
//   },
// });


