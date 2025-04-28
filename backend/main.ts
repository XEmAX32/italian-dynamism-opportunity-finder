import { Application, Router, Status } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import * as mod from "https://deno.land/std@0.213.0/dotenv/mod.ts";
import { Client } from "npm:@notionhq/client";
import { Agent, setup } from './agent.ts';

const keys = await mod.load({export:true})
const notion = new Client({ auth: keys.NOTION_SECRET_KEY });

// await setup();
// console.log('Ready to accept connections');

/* Oak setup */
const app = new Application();
const router = new Router();

router
  .get("/wss", async (ctx) => {
    if(!ctx.isUpgradable)
      ctx.throw(501);

      // console.log('ctx',ctx)

      const ws = ctx.upgrade();
      const agent = new Agent();

      ws.onopen = async () => {
        console.log('Connection established');
        const INITIAL_MSG = `
          {
            "results": [
              {
                "type": "text",
                "content": "Hey there! Do you already have a clear idea of what kind of opportunity you're searching for? If so, feel free to describe it! If not, no worries, I can help you figure it out."
              }
            ]
          }
        `;
        // const stream = await agent.work();
        // let msg = "";
        // console.log(stream)
        // for await (const chunk of stream) {
        //   console.log(chunk.response.delta)
          
        //   try {
        //     ws.send(chunk.response.delta);
        //   } catch (err) {
        //     console.log(err);
        //   }

        //   msg += chunk.response.delta;
        // }
        // ws.send('EOF');

        // agent.addToHistory(msg, "assistant")

        ws.send(INITIAL_MSG);
        agent.addToHistory(INITIAL_MSG, "assistant");
      }
      ws.onclose = () => console.log('Connection closed');
      ws.onmessage = async (m) => {
        const stream = await agent.work(m.data);
        let msg = "";

        for await (const chunk of stream) {
          ws.send(chunk.response.delta);
          msg +=  chunk.response.delta;
        }

        // ws.send('EOF');
        console.log(msg);

        agent.addToHistory(m.data, "user");
        agent.addToHistory(msg, "assistant");
      };
  })
  .get("/opportunity/:id", async (ctx) => {
    console.log("at least i'm here", ctx?.params?.id)
    if(ctx?.params?.id) {
      const opportunities = await notion.databases.query({ 
        database_id: keys.DATABASE_ID, 
        filter: {
          property: 'Name',
          "title": {
            "equals": String(ctx.params.id).replace('*', ' ')
          },
        },
        "page_size": 1,
      }).catch((err) => console.log('err', err));

      console.log(opportunities.results[0].properties.category)
      if (opportunities.results.length > 0)
        ctx.response.body = {
          title: opportunities.results[0].properties["Name"].title[0].text.content,
          description: opportunities.results[0].properties["description"]["rich_text"].length > 0 ? opportunities.results[0].properties["description"]["rich_text"][0]['plain_text'] : "",
          idealCandidate: opportunities.results[0].properties["idealCandidate"]["rich_text"].length > 0 ? opportunities.results[0].properties["idealCandidate"]["rich_text"][0]['plain_text'] : "",
          link: opportunities.results[0].properties["website"]["rich_text"].length > 0 ? opportunities.results[0].properties["website"]["rich_text"][0]['plain_text'] : "",
          howTo: opportunities.results[0].properties["howTo"]["rich_text"].length > 0 ? opportunities.results[0].properties["howTo"]["rich_text"][0]['plain_text'] : "",
          categories: opportunities.results[0].properties.category['multi_select'].map((category) => category.name)
        }
    }
  })
  .get("/opportunities", async (ctx) => {
    const cursor = ctx.request.url.searchParams.get('cursor');
    const query = ctx.request.url.searchParams.get('query');
    var opportunities;

    console.log('query', query)

    if(query) {
      opportunities = await notion.databases.query({ 
        database_id: keys.DATABASE_ID, 
        "page_size": 30,
        "start_cursor": cursor.length > 10 ? cursor : undefined,
        "filter": {
          "or": [
            {
              "property": "description",
              "rich_text": {
                "contains": query
              }
            },
            {
              "property": "organisation",
              "multi_select": {
                "contains": query
              }
            },
            {
              "property": "howTo",
              "rich_text": {
                "contains": query
              }
            },
            {
              "property": "organisationDescription",
              "rich_text": {
                "contains": query
              }
            },
            {
              "property": "idealCandidate",
              "rich_text": {
                "contains": query
              }
            },
            {
              "property": "Name",
              "title": {
                "contains": query
              }
            },
          ]
        }
      })
    } else {
      opportunities = await notion.databases.query({ 
        database_id: keys.DATABASE_ID, 
        "page_size": 30,
        "start_cursor": cursor.length > 10 ? cursor : undefined
      }).catch(err => console.log(err))
    }

    ctx.response.body = {
      data: opportunities.results.map((opportunity) => ({
        title: opportunity.properties["Name"].title[0].text.content,
        description: opportunity.properties["description"]["rich_text"].length > 0 ? opportunity.properties["description"]["rich_text"][0]['plain_text'] : "",
        link: opportunity.properties["website"]["rich_text"].length > 0 ? opportunity.properties["website"]["rich_text"][0]['plain_text'] : "",
      })),
      cursor: opportunities.results.length > 0 ? opportunities.results[opportunities.results.length - 1].id : undefined
    }
  })
  .get("/health", async (ctx) => {
    ctx.response.body = "Working";
  });

app.use(oakCors({origin: "http://localhost:5173"}));
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });