// code to log in and save to session.json
const argv = require('yargs').argv;
(async () => {
  if (argv.h && ((argv.user===undefined)||(argv.pass===undefined))){
    console.log('headless mode requires a username and password!')
    process.exit(1)
  }
  console.log('logging in to Instagram...')
  const browser = await require('puppeteer').launch({ headless: argv.h?true:false});
  let page = (await browser.pages())[0];
  await page.goto('https://www.instagram.com/accounts/login/', {waitUntil: 'networkidle2'});
  if (argv.user && argv.pass) {
    await page.type('input[name=username]', argv.user)
    await page.type('input[name=password]', argv.pass)
    await page.keyboard.press('Enter');
  }
  await page.waitForNavigation({timeout: 9999999})
  let cookies = await page.cookies();
  await require('fs').promises.writeFile('./session.json', JSON.stringify(cookies, null, 2));
  await browser.close()
  console.log('success!')
  process.exit(0)
})();
