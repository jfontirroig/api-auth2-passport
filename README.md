# Install

To install from source:

```bash
git clone https://github.com/paradigma-cl/api-profile.git
npm i
```

# Starting up the registrar

You can run the service in place from its source directory, and you can specify your config file via the `API_OPENID_CONFIG` environment parameter.

```bash
API_OPENID_CONFIG=/home/paradigma/api-profile/config-api_openid.json sudo npm run build && node lib/index.js sudo npm run start
```

### Monitoring via Prometheus

You can configure a monitoring service for the subdomain registrar via adding a `prometheus` field to the configuration file:

```
"prometheus": { "start": true, "port": 5941 }
```

Or by setting the environment variable `API_OPENID_PROMETHEUS_PORT`

# Running with Docker

First copy the config file into a data directory and modify it to suit your needs:

```bash
mkdir -p data
cp config-sample.json data/config.json
vi config.json
```

Once that is done you can spin up the instance using docker-compose. The file will build the image as well:

```bash
docker-compose up -d
```

If you would like to run w/o compose you can do the same with docker:

```bash
# First build the image
docker build . --tag fad_na_at

# Then run it with the proper volumes mounted
docker run -d -v data:/root/ -e API_OPENID_CONFIG=/root/config.json -p 3090:3090 api_openid
```

Root stores the sqlite database that the service uses to login and requisition. To test connectivity for this setup run the following curl command:

Run this command in your terminal :
```bash
curl http://localhost:3060/index | jq
```
You should receive the following output :
```
{
  "status": true
}
```
