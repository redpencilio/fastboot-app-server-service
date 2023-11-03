# fastboot-app-server Docker

This container aims to make it easy to get a Fastboot hosted version of your application running in Docker. It assumes you've installed `ember-cli-fastboot` in your application, with the appropriate configuration.

## Getting started
### Running your ember app
```sh
docker run --name my-app \
    --link my-backend-container:backend \
    -v /path/to/spa/dist:/app \
    -d redpencil/fastboot-app-service
```
### Extending this image in your dockerfile
```Dockerfile

    FROM madnificent/ember:3.18.0 as builder
    LABEL maintainer="info@redpencil.io"

    WORKDIR /app
    COPY package.json .
    RUN npm install
    COPY . .
    RUN ember build --environment production

    FROM redpencil/fastboot-app-server
    COPY --from=builder /app/dist /app
```

## How-to guides
### add the correct adapter for ember-data
Fastboot-server needs to know where to patch requests to, if you're using ember data you can use the following application adapter to route the requests correctly. The BACKEND_URL global is provided by this image and routes to `http://backend`. So make sure to map that to the correct service.

```js
import JSONAPIAdapter from '@ember-data/adapter/json-api';
import {inject as service} from '@ember/service';
export default class ApplicationAdapter extends JSONAPIAdapter {
  @service fastboot;

  constructor(){
    super(...arguments);
    if (this.fastboot.isFastBoot) {
      this.host = window.BACKEND_URL;
    }
  }
}
```

### configure host whitelists
For security you must specify a host whitelist, see [https://www.ember-fastboot.com/docs/user-guide#the-host-whitelist](fastboot docs) for more info.
In your config/environment, make sure you add a key to ENV containing something like:
```js
    fastboot: {
      hostWhitelist: ["localhost","redpencil.io"]
    },
```

When testing, you can just accept anything but that is a big no-no in production:
```js
    fastboot: {
      hostWhitelist: [/.*/]
    },
```
### Configure environment variables in the frontend's container

The environment variables have to be prefixed by `EMBER_` to be recognized by the service as variables to be matched. By using docker-compose, the service configuration will look like:
```yaml
# docker-compose.yml
  services:
    frontend:
        environment:
            EMBER_VAR_EXAMPLE: "example-value"
```            

### Configure the frontend's variables

The frontend's configuration will use `{{VAR_EXAMPLE}}` as a placeholder that will be replaced by this service at runtime.
```js 
// config/environment.js

    if (environment === 'production') {
        ENV['VAR_EXAMPLE'] = '{{VAR_EXAMPLE}}'
    }
```

### using this image in a semantic.works project
Make a build of the application so we can wire it in the docker-compose.yml
```sh
    docker build . -t fastboot-frontend-relance:dev
```
With that in place, we can wire all of this into the docker-compose.yml file
```yaml
      fastboot:
        image: fastboot-frontend-relance:dev
        links:
            - identifier:backend
```

Next up is the wiring in the dispatcher.ex
```elixir
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

