import { ChatOpenAI } from 'npm:@langchain/openai';
import { ChatPromptTemplate, MessagesPlaceholder } from 'npm:@langchain/core/prompts';
import { AIMessage, BaseMessage, HumanMessage } from 'npm:@langchain/core/messages';
import { END, MemorySaver, MessageGraph, START } from 'npm:@langchain/langgraph';
import * as mod from "https://deno.land/std@0.213.0/dotenv/mod.ts";

const keys = await mod.load({export:true})

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `
    You are designed to interview the user in order to gather information on their past experience, interests and dreams.
    Your goal is to gather enough information about the user and their lifepath to suggest them the most fitting opportunity (scholarships, fellowships, grants, events...)

    # HOW YOU SHOULD INTERACT WITH THE USER
    Users will mainly be under 30 years old with big dreams and cool past experiences.
    Use a friendly and cool tone of voice, remember that you're talking with users between 20 and 30 years old. 
    Be brief and avoid repetitions.

    # BEHAVIOR
    Start by asking the user if they already have a clear idea of what kind of opportunity they are searching for, in that case let them descibe it and use opportunity_list_tool to answer.

    If they don't you'll ask them questions to then suggest them the best opportunity:
    - Craft easy and straightforward questions to gather logistical information like nationality and age.
    - First get a broad sense of the person you're talking with and then ask them what they want to get more in depth.
    - Ask one question, wait for the user to answer and then ask the next.
    - When you feel you have a clear understanding of the user you can use opportunity_list_tool to suggest them their best fit.
    
    You should not answer to any question that is not related to the opportunity and talent management.
    If you don't have any opportunity that fits them just output as content "I'm sorry, at the moment I don't have any opportunity that perfectly fits your case, but you can still check out this" and then give them the one that seem most similar to their case.
    If you're asked for more opportunities than you can provide just give them the amount you can and output as content "sorry I don't have the amount of oportunities asked"
    `
  ],
  new MessagesPlaceholder("messages"),
]);

const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
});

const questionGenerationChain = prompt.pipe(llm);

// USER
// let answer = '';
// const request = new HumanMessage({
//   content: 'Hey'
// });

// for await (
//   const chunk of await questionGenerationChain.stream({ messages: [request] })
// ) {
//   console.log(chunk.content);
//   answer += chunk.content;
// }

// console.log('Final answer: ', answer);

// REFLECTION PART

const reflectionPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a quality control expert for interview questions, check that the question is both non repeated from previous questions and reflective enough to give us interesting data.
    
    Quesitons should gather data to suggest the best opportunity for the user, opportunities are discovered based on:
    - location / nationality
    - organisation offering it
    - category
    - participant's age
    - description
    - requirements to apply
    `
  ],
  new MessagesPlaceholder("messages"),
]);

const reflect = reflectionPrompt.pipe(llm);

// USER REFLECTION

// let reflection = "";

// for await (
//   const chunk of await reflect.stream({ messages: [request, new HumanMessage({ content: answer })] })
// ) {
//   console.log(chunk.content);
//   reflection += chunk.content;
// }

// GRAPH

const generationNode = async (messages: BaseMessage[]) => {
  return [await questionGenerationChain.invoke({ messages })]
};

const reflectionNode = async (messages: BaseMessage[]) => {
  const clsMap: { [key: string]: new (content: string) => BaseMessage } = {
    ai: HumanMessage,
    human: AIMessage,
  };

  const translated = [
    messages[0],
    ...messages.splice(1).map((msg) => new clsMap[msg._getType()](msg.content.toString()))
  ];
  
  const res = await reflect.invoke({ messages: translated });
  return [new HumanMessage({ content: res.content })];
};

const workflow = new MessageGraph()
  .addNode("generate", generationNode)
  .addNode("reflect", reflectionNode)
  .addEdge(START, "generate");

const shouldContinue = (messages: BaseMessage[]) => {
  console.log(messages.length)
  if (messages.length > 6) {
    return END;
  }

  return "reflect";
};

workflow
  .addConditionalEdges("generate", shouldContinue)
  .addEdge("reflect", "generate");

const app = workflow.compile({ checkpointer: new MemorySaver() });

const checkpointConfig = { configurable: { thread_id: "my-thread" } };

const stream = await app.stream(
  [
    new HumanMessage({
      content:
        "Hey, I'm 22 years old from Milan Italy",
    }),
  ],
  checkpointConfig,
);

for await (const event of stream) {
  for (const [key, _value] of Object.entries(event)) {
    console.log(`Event: ${key}`);
    // Uncomment to see the result of each step.
    // console.log(_value.map((msg) => msg.content).join("\n"));
    console.log("\n------\n");
  }
}

const snapshot = await app.getState(checkpointConfig);
console.log(
  snapshot.values
    .map((msg: BaseMessage) => msg.content)
    .join("\n\n\n------------------\n\n\n"),
);