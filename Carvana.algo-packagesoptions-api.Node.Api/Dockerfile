FROM node:lts-alpine3.9 as UIBundle

LABEL vendor="carvana"
LABEL description="Builds the UI Bundle"

ARG NPM_TOKEN=6c5efcb5-5ca4-3dd3-bf77-7e6869e9d790
ARG BUILD_TYPE=dev
ENV APP_DIR /home/node/app
RUN mkdir -p ${APP_DIR}/node_modules && chown -R node:node ${APP_DIR}
WORKDIR ${APP_DIR}
RUN echo "NPM token ${NPM_TOKEN} Build Type ${BUILD_TYPE} "
# These are copied like this intentionally
# The folders/files that change least frequently
# are COPY'd step by step that way time-intensive
# steps (like npm install) only occur when there's
# a change to the package.json, NOT when you change
# the app src/ files (which occurs most frequently)
COPY --chown=node:node . ${APP_DIR}/
USER node

# The most time-intensive step 
RUN yarn --ignore-engines

# Don't leave our authToken lying around
RUN rm ${APP_DIR}/.npmrc

RUN npm run build:${BUILD_TYPE}

# Create a new Image so that we only install
# the node_modules/ required to run the express app
FROM node:lts-alpine3.9 as ServeUIBundle

RUN apk update && \ 
  apk upgrade && \
  apk add bash

ENV RUN_ENV=dev
ENV NODE_ENV=development

LABEL vendor="carvana" project="algo-packagesoptions-api"
LABEL description="node api template"

ENV APP_DIR /home/node/app

WORKDIR ${APP_DIR}
RUN chown -R node:node ${APP_DIR}

# Copy ONLY the bundle (no devDependencies inherited from the bundle build steps)
COPY --from=UIBundle ${APP_DIR} ${APP_DIR}
USER node
EXPOSE 4000
CMD bash -c "npm run ${RUN_ENV}:server"