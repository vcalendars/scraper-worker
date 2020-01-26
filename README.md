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

Provide

## Development

Testing can be done with the examples provided in the `test/` directory.

`cat test/sample_configuration.json | npm run dev`
