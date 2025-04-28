console.log('yo')
import * as mod from "https://deno.land/std@0.213.0/dotenv/mod.ts";
import { Client } from "npm:@notionhq/client";

import { ChatOpenAI, OpenAIEmbeddings } from "npm:@langchain/openai";
import { Document } from "npm:langchain/document";
import { formatDocumentsAsString } from "npm:langchain/util/document";
import { MemoryVectorStore } from "npm:langchain/vectorstores/memory";
import { PromptTemplate } from "npm:@langchain/core/prompts";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "npm:@langchain/core/runnables";
import { StringOutputParser } from "npm:@langchain/core/output_parsers";
import { createRetrieverTool } from "npm:langchain/tools/retriever";
import { ToolExecutor } from "npm:@langchain/langgraph/prebuilt";
import { AIMessage, BaseMessage, HumanMessage, FunctionMessage } from 'npm:@langchain/core/messages';
import { END, MemorySaver, MessageGraph, START } from 'npm:@langchain/langgraph';
import { ChatPromptTemplate, MessagesPlaceholder } from 'npm:@langchain/core/prompts';
import { convertToOpenAIFunction } from "@langchain/core/utils/function_calling";

import { zodToJsonSchema } from "npm:zod-to-json-schema";
import { z } from "npm:zod";

const keys = await mod.load({export:true})


// SETUP THE RETRIEVER
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

const vectorStore = await MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings());
const retriever = vectorStore.asRetriever();

// CREATE THE RETRIEVER TOOL

const tool = createRetrieverTool(
  retriever,
  {
    name: "retriever_opportunities",
    description: "Search and return opportunities such as fellowships, grants and scholarships"
  },
);
const tools = [tool];

const toolExecutor = new ToolExecutor({ tools, });


const shouldRetriever = (messages: BaseMessage[]) => {
  console.log('--- DECIDING TO RETRIEVE ---');
  const lastMessage = messages[messages.length - 1];

  if(!lastMessage.additional_kwargs.function_call) {
    console.log('--- DECISION : DO NOT RETRIEVE ---');
    return END;
  }
  console.log('--- DECISION: RETRIEVE ---');
  return "retrieve";
}

const gradeResults = async (messages: BaseMessage[]) => {
  console.log('--- GET RELEVANCE ---');

  const output = zodToJsonSchema(z.object({
    binaryScore: z.string().describe("Relevance score 'yes' or 'no'"),
  }));

  const tool = {
    type: "function" as const,
    function: {
      name: "give_relevance_score",
      description: "give relevance score to retrieved opportunities",
      parameters: output
    }
  }

  const prompt = ChatPromptTemplate.fromTemplate(
    `
      You are a grader asssessing relevance of retrieved opportunities to the user history:
      \n ------ \n
      {context}
      \n ------ \n
      Here's the user history: {question}
      
      If the content of the docs are relevant to the users question, score them as relevant.
      Give a binary score 'yes' or 'no' score to indicate whether the docs are relevant to the question.
      Yes: The docs are relevant to the question.
      No: The docs are not relevant to the question.
    `
  )

  const llm = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0,
  }).bind({
    tools: [tool],
    tool_choice: tool,
  });

  const chain = prompt.pipe(llm);
  const lastMessage = messages[messages.length - 1];

  const score = await chain.invoke({
    question: messages[0].content as string,
    context: lastMessage.content as string,
  });

  return [score];
}

const checkRelevance = (messages: BaseMessage[]) => {
  console.log('--- CHECK RELEVANCE ---');
  const lastMessage = messages[messages.length - 1];
  const toolCalls = lastMessage.additional_kwargs.tool_calls;

  if(!toolCalls)
    throw new Error("Last message was not a function message");

  const parsedArgs = JSON.parse(toolCalls[0].function.arguments);

  if(parsedArgs.binaryScore === 'yes') {
    console.log('--- DECISION: RELEVANT');
    return 'yes';
  } else {
    console.log('--- DECISION: NOT RELEVANT');
    return 'no';
  }
}

const agent = async (messages: BaseMessage[]) => {
  console.log('--- CALL AGENT ---');
  const functions = tools.map((tool) => convertToOpenAIFunction(tool));

  const llm = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0,
    streaming: true
  }).bind({
    functions
  });

  const response = await llm.invoke(messages);
  return [response];
}

const retrieve = async (messages: BaseMessage[]) => {
  console.log('--- DOING RETRIEVAL ---');
  const lastMessage = messages[messages.length - 1];
  const action = {
    tool: lastMessage.additional_kwargs.function_call?.name ?? "",
    toolInput: JSON.parse(
      lastMessage.additional_kwargs.function_call?.arguments ?? "{}",
    ),
  };

  const response = await toolExecutor.invoke(action);
  const functionMessage = new FunctionMessage({
    name: action.tool,
    content: response,
  });

  return [functionMessage];
}

const rewrite = async (messages: BaseMessage[]) => {
}