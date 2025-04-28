frontend: deno + vite + react
backend: deno 

farlo partire: "deno task dev" (+ npm i per il frontend, non necessario per il backend)

# Progettualità
- repository di opportunità sempre aggiornata con cui puoi chattare
- dev'essere integrata con il nostro sito [www.italiandynamism.it](http://italiandynamism.com/) (o con un link che porta a un altro webserver o direttamente unendo le codebases)
- lista di opportunità + vista specifica della singola opportunità + chatbot 
- l'utente che atterra sulla pagina deve vedere la prima parte della lista, scorrendo deve venirgli richiesto di registrarsi, la stessa cosa se prova a interagire con la chat e se prova a cliccare su un'opportunità

qui un'idea di come mi aspetto l'esperienza [demo](https://v0.dev/chat/custom-chatbot-layout-IFyBCRz1mMo) però sentiti libero di ripensarla sia a livello UI che UX 

# Chatbot 
agente gestito con langchain, i suoi obiettivi:
- ricerca intelligente delle opportunità
- intervistare l'utente per capire che opportunità proporgli 
- graficamente quando restituisce le opportunità le visualizza con lo stesso box che sarà usato nella lista delle opportunità
file backend/interviewer.ts 

# Scraper
il valore della piattaforma è sì nell'avere un'ampia selezione di opportunità, ma anche nel fatto che queste siano sempre aggiornate, quindi c'è uno scraper llm powered che aggiorna i dati a db (oggi notion)
file backend/scraper.ts

qui il link al db [opportunità](https://resisted-antelope-d53.notion.site/ec1791d02862437989d02c897eb14abd?v=d3c26c5274bc4fbca0a648d173380770&pvs=4) 
