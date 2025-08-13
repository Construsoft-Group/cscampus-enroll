#FROM node:14.16.1
FROM node:18

WORKDIR /app

# Explicitly unset NODE_ENV to ensure devDependencies are installed
ENV NODE_ENV=development

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

