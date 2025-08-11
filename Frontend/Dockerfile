# Frontend Dockerfile
FROM node:20-alpine AS build
ARG VITE_API_BASE
ENV VITE_API_BASE=${VITE_API_BASE}
WORKDIR /app
COPY package*.json /app/
RUN npm ci
COPY . /app
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=build /app /app
EXPOSE 5173
# Use vite preview to serve the built app
CMD ["npm","run","preview","--","--host","0.0.0.0","--port","5173"]
