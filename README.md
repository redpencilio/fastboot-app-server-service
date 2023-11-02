# fastboot-app-server-service

Docker image to host your Ember Fastboot app.

## Getting started
### Build an image to host your Ember Fastboot app
Requires:
- an Ember frontend app with `ember-cli-fastboot` installed

Add a Dockerfile with the following contents:
```Dockerfile
    FROM madnificent/ember:4.8.0 as builder
    LABEL maintainer="info@redpencil.io"

    WORKDIR /app
    COPY package.json .
    RUN npm install
    COPY . .
    RUN ember build --environment production

    FROM redpencil/fastboot-app-server:1.1.0
    COPY --from=builder /app/dist /app
```

There are various ways to build a Docker image. For a production service we advise to setup automatic builds, but here we will build it locally. You can choose any name, but we will call ours 'my-fastboot-frontend'.

From the root of your microservice folder execute the following command:
```bash
docker build -t my-fastboot-frontend .
```

Add the newly built service to your application stack in `docker-compose.yml`. Link the service HTTP requests must be sent to as `backend`.
```yml
version: ...
services:
  frontend:
    image: my-fastboot-frontend
    links:
      - backend:backend
  ...
  backend:
    ...
```

Launch the new container in your app
```bash
docker-compose up -d my-fastboot-frontend
```

## How-to
### Wire this image in a semantic.works project
Requires:
  - 'Build an image to host your Ember fastboot app'
  - a semantic.works stack, like mu-project

Link the identifier service as `backend` for your frontend service in `docker-compose.yml`
```yml
version: ...
services:
  identifier:
    image: semtech/mu-identifier
    ...
  frontend:
    image: my-fastboot-frontend
    links:
      - identifier:backend
  ...
```

Next, configure the dispatcher such that the HTML pages of the frontend are served, unless an Accept header is passed that is too restrictive.

```elixir
defmodule Dispatcher do
  use Matcher

  define_accept_types [
    json: [ "application/json", "application/vnd.api+json" ],
    html: [ "text/html", "application/xhtml+html" ],
    any: [ "*/*" ]
  ]

  define_layers [ :static, :web_page, :api_services, :not_found ]

  ###############
  # STATIC
  ###############

  get "/assets/*path", %{ layer: :static } do
    forward conn, path, "http://frontend/assets/"
  end

  get "/favicon.ico", %{ layer: :static } do
    send_resp( conn, 404, "" )
  end

  #################
  # FRONTEND PAGES
  #################

  get "/*path", %{ layer: :web_page, accept: %{ html: true } } do
    forward conn, path, "http://frontend/"
  end

  ###############
  # API SERVICES
  ###############

  # Configure other requests that should be sent to backend services
  # like mu-cl-resources here. E.g.:
  #
  # get "/catalogs/*path", %{ layer: :api_services, accept: %{ json: true } } do
  #   forward conn, path, "http://resources/catalogs/"
  # end
  #
  # ...

  #################
  # NOT FOUND
  #################
  match "/*_", %{ layer: :not_found } do
    send_resp( conn, 404, "Route not found.  See config/dispatcher.ex" )
  end

end
```

Note that the `web_page` layer is fairly early on because user agents which expect web pages tend to send requests accepting any content type (like `*/*`).

Restart the dispatcher to enable the new rules

```bash
docker-compose restart dispatcher
```
### Configure the Ember Data adapter to send requests to the backend
Fastboot-server is configured to patch requests to `http://backend`. This value is available as global through `window.BACKEND_URL`. If you're using Ember Data in your app, you can use the following application adapter to route the requests correctly to your backend.

```js
import JSONAPIAdapter from '@ember-data/adapter/json-api';
import { inject as service } from '@ember/service';

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

### Configure an Ember application at runtime using environment variables
The service can use environment variables to configure an Ember frontend build at runtime. This is typcially used for environment-specific (development, production, test, ...) configurations. On startup of the service, the environment variables prefixed with `EMBER_` will be used to fill in the values in `/app/index.html` with the value of the environment variables that match.

#### Configuring placeholders in the Ember application
Use placeholders like `{{MY_EXAMPLE}}` in the Ember configuration file `./config/environment.js` where values from an environment variable need to be filled in at runtime.

```javascript
if (environment === 'production') {
    ENV.torii.providers['oauth2'].apiKey = '{{OAUTH_API_KEY}}'
}
```

#### Set environment variables on the container
Configure environment variables on the frontend service in `docker-compose.yml` containing the values to be replaced in the Ember configuration file. The environment variables need to be prefixed with `EMBER_`.

E.g. for the placeholder `{{OAUTH_API_KEY}}` to be replaced, you need to configure an environment variable `EMBER_OAUTH_API_KEY`.

```yml
services:
  frontend:
    image: my-fastboot-frontend
    environment:
      EMBER_OAUTH_API_KEY: "my-api-key-for-production"
```

### Configure the host whitelists
For security you must specify [a host whitelist of expected hosts](https://www.ember-fastboot.com/docs/user-guide#the-host-whitelist). On a deployed system, this is typically the domain your app is hosted on, while in development mode, it's `localhost`.

Add the following contents in `config/enviroment.js` to support both scenarios:
```js
module.exports = function (environment) {
  const ENV = {
    ...
    fastboot: {
      hostWhitelist: ['{{FASTBOOT_HOST}}']
    },
    ...
  }

  if (environment === 'development') {
    ENV.fastboot.hostWhitelist = ['/^localhost(:[0-9]*)?/'];
    ...
  }

  ...
};
```

When deploying the app, configure the host via the `EMBER_FASTBOOT_HOST` environment variable on your container in `docker-compose.yml`:

```yml
services:
  frontend:
    image: my-fastboot-frontend
    environment:
      EMBER_FASTBOOT_HOST: "my.app-domain.org"
```
### Customize the fastboot settings

You may have special settings you want to pass to fastboot. This is done by adding a `config/fastboot.js` file to your app and copying it over to the fastboot server container.

e.g.:

``` javascript
// config/fastboot.js
module.exports = function () {
  return {
    buildSandboxGlobals(defaultGlobals) {
      return Object.assign({}, defaultGlobals, {
        SOME_CUSTOM_GLOBAL: "foo",
        BACKEND_URL: "http://backend"
      });
    },
  };
};

```

``` dockerfile

  FROM madnificent/ember:4.12.1-node_18 as builder

  LABEL maintainer="info@redpencil.io"

  WORKDIR /app
  COPY package.json .
  RUN npm install
  COPY . .
  RUN ember build --environment production

  FROM redpencil/fastboot-app-server
  COPY --from=builder /app/dist /app
+ COPY --from=builder /app/config/fastboot.js /app
```


If you export a function, it will be called, and the resulting object will be spread out onto the
default config. If it's an object, it will be used directly:


``` javascript
let fastbootAppServer = new FastbootAppServer({
  port: 80,
  distPath: "/app/",
  chunkedResponse: false,
  gzip: true,
  log: true,
  buildSandboxGlobals(defaultGlobals) {
    return Object.assign(
      {},
      defaultGlobals,
        {BACKEND_URL: "http://backend"}
    );
  },
  ...customConfig // your config,
});

```

> [!WARNING]  
> If you override the buildSandboxGlobals function, you should probably include the BACKEND_URL like in the example above, since it allows fastboot to find your backend in a docker-compose 
> setup. 

