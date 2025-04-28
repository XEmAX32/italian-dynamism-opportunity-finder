import { SimpleDirectoryReader, OpenAI } from "npm:llamaindex@0.1.18";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import * as mod from "https://deno.land/std@0.213.0/dotenv/mod.ts";
import { Client } from "npm:@notionhq/client";

const keys = await mod.load({export:true})

const notion = new Client({ auth: keys.NOTION_SECRET_KEY });
const opportunities = await notion.databases.query({ 
    database_id: keys.DATABASE_ID, 
    filter: {
      property: 'description',
      "rich_text": {
        "is_empty": true
      },
    },
    "page_size": 30,
  });

const llm = new OpenAI({
  model: "gpt-4-1106-preview",
  additionalChatOptions: { response_format: { type: "json_object" } },
});

const categories = [
  {
    name: 'Youth participation',
    description: 'programs to participate in society activities and help the community'
  },
  { 
    name: 'Challenge',
    description: '' 
  },
  {
    name: 'Mentoring',
    description: ''
  },
  {
    name: 'International Mobility',
    description: 'programs that involve changing country like Erasmus'
  },
  {
    name: 'Talent Program',
    description: ''
  },
  {
    name: 'Learning',
    description: '',
  },
  {
    name: 'Prize',
    description: ''
  },
  {
    name: 'Tech',
    description: ''
  },
  {
    name: 'Politics',
    description: ''
  },
  {
    name: 'Startup',
    description: ''
  },
  {
    name: 'Cybersecurity',
    description: ''
  },
  { 
    name: 'Business',
    description: ''
  },
  {
    name: 'Arts',
    description: ''
  },
  {
    name: 'Music',
    description: '',
  },
  {
    name: 'Creativity',
    description: ''
  },
  {
    name: 'Leadership',
    description: ''
  },
  {
    name: 'Climate',
    description: ''
  }
];

const example = {
  description: "description of what the opportunity, it's super important that you list in a concrete way what the opportunity gets you. If the text says you can meet particularly cool people state their names.",
  organisation: "brief description of the organisation offering this opportunity",
  howTo: "how to apply to this opportunity, what are the steps",
  status: "0 if it's currently accepting applications, 1 if it's non accepting applications (note if the closing date is passed this should be false), 2 if the program has been closed permanently, number format, if unsure leave empty",
  category: `array of categories, here the complete list, pick the ones that fits the most, maximum three: ${categories.reduce((acc, category) => acc+category.name+(category.description.length > 0 && "(meaning: "+category.description+")")+", ", "")}`,
  idealCandidate: "according to what they're saying what should the ideal candidate have or show?",
  age: {
    min: "minimum age to apply, number format",
    max: "maximum age to apply, number format",
  },
  applicationDate: {
    opens: "date when people can start applying, timestamp format, if none or unsure leave empty",
    opensEvidence: "write a line of evidence of where you find the information about application opening date",
    closes: "date when applications closes, timestamp format, if none or unsure leave empty",
    closeEvidence: "write a line of evidence of where you find the information about application closing date",
  }
}

for (let opportunity of opportunities.results) {
  console.log(opportunity.properties['description']['rich_text'])
  if(opportunity.properties['description']['rich_text'].length > 0)
    continue;

  if(opportunity.properties['website']['rich_text'].length == 0)
    continue;

  const url = opportunity.properties['website']['rich_text'][0]['plain_text'];
  console.log('STARTED WORKING ON - ', url)

  let list: string[] = [url];
  let visited: string[] = [];
  let fileCount = 0;
  const domain = url.split('//')[1].replace('www.', '').split('/')[0]

  while(list.length > 0) {
    const candidate = !list[0].includes('https://') ? 'https://www.' + domain + list[0] : list[0];

    let html;
    try {
      const res = await fetch(candidate);
      html = await res.text();
    } catch(err) {
      console.log(err)
    }

    /* save file */
    console.log('SAVING - ', candidate)
    await Deno.writeTextFile("storage/htmlDir/"+fileCount+".html", html);
    fileCount++;
    visited.push(candidate);
    list.shift();

    /* extract anchors */
    let anchors;
    try {
      const $ = cheerio.load(html);
      anchors = $('a').get();
    } catch(err) {
      console.log(err);
      continue;
    }


    for(let i=0; i < anchors.length; i++) {
      const page = anchors[i];
      const href = page.attribs['href'];

      if(href == undefined)
        continue;

      const completedHref = href.includes('http') ? href : url + href;

      if(!completedHref.includes('#') && completedHref.includes(domain) && !((list.concat(visited)).includes(completedHref) || (list.concat(visited)).includes(completedHref.substr(0, completedHref.length - 1))))
        list.push(completedHref);
    }

    if(visited.length > 8)
      break;
  }

  try {
    const MAX_LENGTH = 15000;
    console.log('READING DATA...');
    const documents = await new SimpleDirectoryReader().loadData({directoryPath: "storage/htmlDir/"})

    const data = documents.reduce((acc, curr) => (acc+curr).length > MAX_LENGTH ? acc : acc+curr.text, "");

    console.log('THINKING...');
    const resp = await llm.chat({
      messages: [
        {
          role: "system",
          content: `You are an expert assistant at extracting data from texts, answer in English. Generate a valid JSON in the following format: \n\n ${JSON.stringify(example)}`,
        },
        {
          role: "user",
          content: `Here is the transcript: \n -------- \n ${data} \n --------`,
        },
      ],
    })

    const parsedResponse = JSON.parse(resp.message.content);
    console.log(parsedResponse)
    console.log('DATE', new Date(parsedResponse.applicationDate.opens))

    const properties = {
      "description": {
        "rich_text": [
          {
            "type": "text",
            "text": {
              "content": parsedResponse.description,
            }
          }
        ]
      },
      "organisationDescription": {
        "rich_text": [
          {
            "type": "text",
            "text": {
              "content": parsedResponse.organisation,
            }
          }
        ]
      },
      "idealCandidate": {
        "rich_text": [
          {
            "type": "text",
            "text": {
              "content": parsedResponse.idealCandidate,
            }
          }
        ]
      },
      "howTo": {
        "rich_text": [
          {
            "type": "text",
            "text": {
              "content": parsedResponse.howTo,
            }
          }
        ]
      },
    };

    if(typeof parsedResponse.age.min == "number")
      properties['ageMin'] = {
        "type": "number",
        "number": Number(parsedResponse.age.min)
      };
    
    if(typeof parsedResponse.age.max == "number")
      properties['ageMax'] = {
        "type": "number",
        "number": Number(parsedResponse.age.max)
      };

    if(parsedResponse.applicationDate.opens.length > 0)
      properties["opens"] = {
        "type": "date",
        "date": {
          "start": new Date(parsedResponse.applicationDate.opens)
        }
      };
    
    if(parsedResponse.applicationDate.closes.length > 0)
      properties["closes"] = {
        "type": "date",
        "date": {
          "start": new Date(parsedResponse.applicationDate.closes)
        }
      };

    const getStatus = (status) => {
      if(Number(status) == 0)
        return "selecting";
      if(Number(status) == 1)
        return "closed";
      if(Number(status) == 2)
        return "inactive";
    }
    
    if(typeof parsedResponse.applicationDate.status == "number")
      properties["status"] = {
        "status": {
          "options": [
            {
              name: getStatus(parsedResponse.applicationDate.status),
            }
          ]
        }
      };

    if(parsedResponse.category.length > 0)
      properties["category"] = {
        "multi_select": parsedResponse.category.map((category) => ({
          name: category,
        }))
      };
    
    /* update Notion page */
    try {
      const response = await notion.pages.update({
        page_id: opportunity.id,
        properties,
      });
      console.log(response)
    } catch (err) {
      console.log(err);
    }  
  } catch (err) {
    console.log(err);
  }

  for(let i=0; i < fileCount; i++)
    await Deno.remove("storage/htmlDir/"+i+".html");
  
}






// let res = await fetch(url + "/sitemap");
// for(let opportunity of opportunities) {
//   let list: string[] = [url];
//   let visited: string[] = [];
//   let fileCount = 0;
//   const domain = url.split('//')[1].replace('www.', '').split('/')[0]

//   while(list.length > 0) {
//     const candidate = list[0];

//     const res = await fetch(candidate);
//     const html = await res.text();

//     /* save file */
//     console.log('SAVING - ', candidate)
//     await Deno.writeTextFile("api/storage/htmlDir/"+fileCount+".html", html);
//     fileCount++;
//     visited.push(candidate);
//     list.shift();

//     /* extract anchors */
//     const $ = cheerio.load(html);
//     const anchors = $('a').get();

//     for(let i=0; i < anchors.length; i++) {
//       const page = anchors[i];
//       const href = page.attribs['href'];
//       const completedHref = href.includes('http') ? href : url + href;

//       if(!completedHref.includes('#') && completedHref.includes(domain) && !((list.concat(visited)).includes(completedHref) || (list.concat(visited)).includes(completedHref.substr(0, completedHref.length - 1))))
//         list.push(completedHref);
//     }
//   }

//   try {
//     console.log('READING DATA...');
//     const documents = await new SimpleDirectoryReader().loadData({directoryPath: "api/storage/htmlDir/"})

//     const data = documents.reduce((acc, curr) => acc+curr.text, "");

//     console.log('THINKING...');
//     const resp = await llm.chat({
//       messages: [
//         {
//           role: "system",
//           content: `You are an expert assistant at extracting data from texts, answer in English. Generate a valid JSON in the following format: \n\n ${JSON.stringify(example)}`,
//         },
//         {
//           role: "user",
//           content: `Here is the transcript: \n -------- \n ${data} \n --------`,
//         },
//       ],
//     })

//     console.log(JSON.parse(resp.message.content));
//   } catch (err) {
//     console.log(err);
//   }

//   for(let i=0; i < fileCount; i++)
//     await Deno.remove("api/storage/htmlDir/"+i+".html");
// }

// try {
//   const res = await fetch(url);
//   const html = await res.text();
//   const $ = cheerio.load(html)  
//   const anchors = $('loc');

//   for(let i=0; i<anchors.length; i++) {
//     const page = anchors[i].children[0].data;
//     if(page.includes('privacy'))
//       continue;

//     const res = await fetch(page);
//     const html = await res.text();

//     await Deno.writeTextFile("api/storage/"+name+"/"+i+".html", html);
//   }

  // const documents = await new SimpleDirectoryReader().loadData({directoryPath: "api/storage/aurora/"})

  // const data = documents.reduce((acc, curr) => acc+curr.text, "");
  
  // const resp = await llm.chat({
  //   messages: [
  //     {
  //       role: "system",
  //       content: `You are an expert assistant at extracting data from texts, answer in English. Generate a valid JSON in the following format: \n\n ${JSON.stringify(example)}`,
  //     },
  //     {
  //       role: "user",
  //       content: `Here is the transcript: \n -------- \n ${data} \n --------`,
  //     },
  //   ],
  // })

//   console.log(JSON.parse(resp.message.content));
// } catch(err) {
//   console.log(err);
// }