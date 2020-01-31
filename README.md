# Scraper Worker

Worker that scrapes volleyball timetables from the web based on a configuration file and emits JSON to rabbit

## Usage

### Configuration

Provide configuration containing all the targets you wish to scrape via json on stdin.

```json
{
  "targets": [
    {
      "url": "https://www.volleyballsa.com.au/social/indoor/fixtures",
      "scraperName": "volleyball-sa",
      "timezone": "Australia/Adelaide",
      "options": {}
    }
  ]
}
```

Provide other configuration details details via environment variables

| Name               | Default Value | Description                                    |
|--------------------|---------------|------------------------------------------------|
| RABBIT_MQ_USER     | scraper       | Username to connect to rabbit                  |
| RABBIT_MQ_PASS     | scraper       | Password to connect to rabbit                  |
| RABBIT_MQ_HOST     | localhost     | Hostname of the rabbit instance                |
| RABBIT_MQ_PORT     | 5672          | Port on which to connect to rabbit             |
| RABBIT_MQ_EXCHANGE | scraper       | The name of the exchange to publish seasons to |
| LOG_LEVEL          | info          | The minimum log level that will be printed     |

### Docker Run

A manual run can be done with docker using the following command:

`docker run --volume=$(echo $PWD)/test:/usr/config --env-file=.env vcalendars/scraper-worker`

## Development

Testing can be done with the examples provided in the `test/` directory.

`cat test/config.json | npm run dev`
