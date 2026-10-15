FROM node:22-alpine as builder

RUN apk add --no-cache git

WORKDIR /usr/src

RUN git clone https://github.com/themost-framework/site.git app

WORKDIR /usr/src/app

RUN npm i

# Get artifacts from the build stage
RUN mkdir -p ./public/articles/data
RUN npx degit https://github.com/themost-framework/data/docs#master public/articles/data

RUN mkdir -p ./public/articles/query
RUN npx degit https://github.com/themost-framework/query/docs#master public/articles/query

RUN mkdir -p ./public/articles/express
RUN npx degit https://github.com/themost-framework/express/docs#master public/articles/express

RUN npm run build

FROM nginx:stable-alpine AS production

COPY --from=builder /usr/src/app/dist/ /usr/share/nginx/html

EXPOSE 3000