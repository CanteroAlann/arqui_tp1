FROM node:16-alpine
WORKDIR /app
COPY index.js package.json package-lock.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]