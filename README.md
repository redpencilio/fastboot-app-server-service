# fastboot-app-server Docker

Run fastboot-app-server in Docker.

## Getting started

_Getting started with fastboot-app-server Docker_

This container aims to make it easy to get a Fastboot hosted version of your application running in Docker.

The appropriate way to add the container is to install `ember-cli-fastboot` into your project.  This will ensure that when you create a build, it will contain the necessary sources for Fastboot to take over.  In your config/environment, make sure you add a key to ENV containing something like:

    fastboot: {
      hostWhitelist: ["localhost","redpencil.io"]
    },

When testing, you can just accept anything but that is a big no-no in production:

    fastboot: {
      hostWhitelist: [/.*/]
    },

Creating a nice fastboot build then boils down to something like the following:

    FROM madnificent/ember:3.18.0 as builder

    LABEL maintainer="info@redpencil.io"

    WORKDIR /app
    COPY package.json .
    RUN npm install
    COPY . .
    RUN ember build --environment production

    FROM redpencil/fastboot-app-server
    COPY --from=builder /app/dist /app

Make a build of the application so we can wire it in the docker-compose.yml

    docker build . -t fastboot-frontend-relance:dev

With that in place, we can wire all of this into the docker-compose.yml file

      fastboot:
        image: fastboot-frontend-relance:dev
        links:
            - identifier:backend

Next up is the wiring in the dispatcher.ex

    defmodule Disptacher do
      use Matcher

      define_accept_types [
        json: [ "application/json", "application/vnd.api+json" ],
        html: [ "text/html", "application/xhtml+html" ],
        any: ["*/*"]
      ]

      @json %{ accept: %{ json: true } }
      @html %{ accept: %{ html: true } }
      @any %{ accept: %{ any: true } }

      match "/favicon.ico", @any do
        send_resp( conn, 404, "There is no favicon here" )
      end

      match "/assets/*path", @any do
        Proxy.forward conn, path, "http://fastboot:3000/assets/"
      end

      match "/*path", @html do
        Proxy.forward conn, path, "http://fastboot:3000/"
      end

      last_match
    end

Launch it all up and pages which don't need a backend will be handled by Fastboot.  Checkout the how-to guides for info on how to support ember-data.

## How-to guides

_Specific guides on how to use fastboot-app-server Docker_

### Going to a different backend for Ember Data

The backend service to be accessed is going to be different in fastboot than when running on the client.

A client fetches the app and sends it requests to the same endpoint.  The fastboot proxy container doesn't have a backend attached to localhost and must query elsewhere.

In order to mitigate this problem, the ember app has a window.BACKEND_URL set to "http://backend" when running in fastbooty.  This lets you set the backend host for ember-data in the application adapter.

Create an application adapter in `/app/adapters/application.js` looking like:

    import JSONAPIAdapter from '@ember-data/adapter/json-api';

    export default class ApplicationAdapter extends JSONAPIAdapter {

      constructor(){
        super(...arguments);
        this.host = ENV.backendHost;
      }
    }

When running in fastboot, your adapter will now send requests to the API at `http://backend/`, which you can link to the container.


### Configure environment variables in the frontend's container

The environment variables have to be prefixed by `EMBER_` to be recognized by the service as variables to be matched. By using docker-compose, the service configuration will look like:

    docker-compose.yml

    frontend:
        environment:
            EMBER_VAR_EXAMPLE: "example-value"

### Configure the frontend's variables

The frontend's configuration will use `{{VAR_EXAMPLE}}` as a placeholder that will be replaced by this service at runtime.

    config/environment.js

    if (environment === 'production') {
        ENV['VAR_EXAMPLE'] = '{{VAR_EXAMPLE}}'
    }


## Reasoning

_Background information about the approach we took_

## API

_Provided application interface_
