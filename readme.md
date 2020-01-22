# instascrape

scrapes an instagram profile and optionally makes a slideshow of pictures

## Quickstart

```bash
# you should only have to do this once
$ npm install
$ node login

# scrape pictures
$ node scrape <user to scrape>

# scrape a video as well
$ node scrape <user to scrape> -v
```

## Usage

```bash
node scrape <user to scrape>

-sb    show browser (headless by default)
-d     delay between arrow key presses (1s by default, do not go too low)
-v     create video slideshow from pictures
--vo   video only (somehow bugged, have to use both dashes, no argument)
--fps  fps of video (default is 1/3fps)
```

```bash
node login # saves to session.json

-h      run browser headless
--user  your username
--pass  your password
(note, user and pass are required when using headless)
```

## To-Do
- cleanup code and separate into picture archive and video creator
- ADD ASYNC CATCH
- nicer file paths
- code cleanup
- add audio to video
- check if it works on Windows
- output video codec

## License
[ISC](https://opensource.org/licenses/ISC)
