FROM denoland/deno

EXPOSE 8000

WORKDIR /app

ADD ./api /app

RUN deno cache server.ts

CMD ["run", "--allow-net", "--allow-env", "--allow-read", "--allow-sys", "--allow-write", "server.ts"]