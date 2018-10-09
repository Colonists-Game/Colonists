FROM node:alpine as builder
WORKDIR /app
COPY ./pilgrims/package*.json ./
RUN npm install
COPY ./pilgrims .
RUN npm run build

FROM nginx:alpine
COPY default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html/