# Scraper Worker

Worker that scrapes volleyball timetables from the web based on a configuration file and emits JSON to rabbit

## Usage

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

Provide RabbitMQ details via environment variables

- RABBIT_MQ_USER Username to connect to rabbit
- RABBIT_MQ_PASS Password to connect to rabbit
- RABBIT_MQ_HOST Hostname of the rabbit instance
- RABBIT_MQ_PORT Port on which to connect to rabbit
- RABBIT_MQ_EXCHANGE The name of the exchange to publish seasons to

## Development

Testing can be done with the examples provided in the `test/` directory.

`cat test/sample_configuration.json | npm run dev`
