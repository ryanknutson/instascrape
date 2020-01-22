const puppeteer = require('puppeteer')
const ffmpeg = require('fluent-ffmpeg')
const request = require('request')
const fs = require('fs').promises
const del = require('del')
const moment = require('moment')
const mkdirp = require('mkdirp')
const cliProgress = require('cli-progress')
const argv = require('yargs').argv;

const startup = async () => {
  // no username error
  if (process.argv[2] === undefined) {
    console.log("enter a profile to scrape...")
    console.log("usage: node index.js PROFILE FPS")
    process.exit(1)
  }

  // check if the session store exists, otherwise need to login
  await fs.stat('./session.json')
  .catch(e=>{
    console.log('need to log in')
    console.log('(run \'node login\')')
    process.exit(0)
  })
}

// this uses puppeteer to scrape the instagram posts off a user's profile and return the results
const getUrls = async profile => {
    // start puppeteer
    const browser = await puppeteer.launch({headless: argv.sb?false:true});
    let page = (await browser.pages())[0];
    await page.setViewport({ width: 500, height: 1000 });

    // go to profile and load session
    console.log('navigating to page...')
    await page.goto(`https://www.instagram.com/`,{waitUntil: 'networkidle2'});
    const cookiesString = await fs.readFile('./session.json');
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
    await page.goto(`https://www.instagram.com/${profile}/`,{waitUntil: 'networkidle2'});

    // get number of posts
    let postCount = await page.evaluate(e=>document.evaluate("//span[text()=' posts']//span", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.innerText)

    // click on most recent post
    await page.mouse.click(30, 600);
    await page.waitFor(500);

    // scrape posts
    console.log("scraping posts...")
    const progressbar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    progressbar.start(postCount, 0);
    let arr = []
    for(var i = 1; i <= postCount; i++){
      // add user posts urls to array
      let postUrl = await page.url()
      arr.unshift(postUrl)

      // updateprogress
      progressbar.update(i);

      // press the right arrow to move to next post
      await page.waitFor(argv.d?argv.d:1000);
      await page.keyboard.press('ArrowRight')
    }

    // close the browser down and return array of user posts
    await browser.close()
    return arr;
}

// merge the downloaded photos to a video
let merge = () => new Promise((resolve, reject) => {
  console.log('\nstarting merge...')
  // const progressbar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  // progressbar.start(100, 0);
  ffmpeg()
  .input(`${__dirname}/%04d.jpg`)
  .inputFPS(argv.fps?argv.fps:(1/3))
  .output('out.mp4')
  .outputOptions([
    '-c:v libx264',
    '-pix_fmt yuv420p'
  ])
  .on('end', e=>resolve())
  .run()
});

let cleanup = dir => new Promise((resolve, reject) => {
  console.log("cleaning up...")

  fs.readdir(__dirname).then(e=>{
    var filtered = e.filter(x => /[0-9]*.jpg|out.mp4/.test(x));
    Promise.all(filtered.map(oldname => fs.rename(oldname, `${dir}/${oldname}`))).then(resolve())
  });
});

let cleanupvo = () => new Promise((resolve, reject) => {
  fs.readdir(__dirname).then(e=>{
    var filtered = e.filter(x => /[0-9]*.jpg/.test(x));
    Promise.all(filtered.map(oldname => fs.unlink(oldname))).then(resolve())
  });
});

(async () => {
  let dir = `./downloads/${process.argv[2]}/${moment().format('YYYY-MM-DD_hh:mm')}`;

  mkdirp(dir, (err) => {
    if(err) reject(err)
  });

  // run startup scripts
  await startup();

  console.log('loading... please wait')

  // rip post urls from profile
  let urls = await getUrls(process.argv[2]);

  // filter out any duplicates that may occur
  urls = urls.filter((a, b) => urls.indexOf(a) === b)

  // download the posts
  let requests = urls.map((url, i) => new Promise((resolve, reject) => {
    request(url+"media?size=l", {encoding: 'binary'}, (error, response, body) => {
      if(error) reject(error);
      require('fs').writeFile(`${i.toString().padStart(4, '0')}.jpg`, body, 'binary', err => err?reject(err):resolve());
    })
  }));
  await Promise.all(requests);

  // merge to video
  if (argv.v || argv.vo) await merge();

  if (argv.vo) await cleanupvo();
  else await cleanup(dir);

  process.exit(0)
})();
