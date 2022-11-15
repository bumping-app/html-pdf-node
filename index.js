const puppeteer = require('puppeteer');
var Promise = require('bluebird');
const hb = require('handlebars')
const inlineCss = require('inline-css')
module.exports
async function generatePdf(file, options, callback) {
  // we are using headless mode
  let args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
  ];
  if(options.args) {
    args = options.args;
    delete options.args;
  }

  const browser = await puppeteer.launch({
    args: args
  });
  const page = await browser.newPage();

  if(file.content) {
    data = await inlineCss(file.content, {url:"/"});
    console.log("Compiling the template with handlebars")
    // we have compile our code with handlebars
    const template = hb.compile(data, { strict: true });
    const result = template(data);
    const html = result;

    // We set the page content as the generated html by handlebars
    await page.setContent(html, {
      waitUntil: 'networkidle0', // wait for page to load completely
    });
  } else {
    await page.goto(file.url, {
      waitUntil:[ 'load', 'networkidle0'], // wait for page to load completely
    });
  }

  return Promise.props(page.pdf(options))
    .then(async function(data) {
       await browser.close();

       return Buffer.from(Object.values(data));
    }).asCallback(callback);
}

async function generatePdfs(files, options, callback) {
  // we are using headless mode
  let args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
  ];
  if(options.args) {
    args = options.args;
    delete options.args;
  }
  const browser = await puppeteer.launch({
    args: args
  });
  let pdfs = [];
  let count = 0;
  const page = await browser.newPage();
  await page.emulateMediaType('print');
  //background-repeat: repeat-y;
  //background-attachment: fixed;
  //background-size: 100% auto;
  // border: 2px solid black;
  //position: fixed; /* Sit on top of the page content */
  // #bodydiv
  // @page {
  //   size: A4 portait;
  //   margin: 0;
  // }
  // 420 x 595 pixels
  // size: A4 portait;
  // 140px
  // , linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)) 
  // background-image: url('https://bumping-files.s3.ap-east-1.amazonaws.com/uploads/59tytdtbrasdo2slf2m80-Bump-bump-imageimage.JPEG'), linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5));
            // background-size: 100% 100% ;
            // background-blend-mode: overlay;
            // background-repeat: repeat;
            // background-position: left bottom;
          //}
  for(let file of files) {
    if(file.content) {
      data = await inlineCss(file.content, {
        url:"/", 
        extraCss:`
          @page {
            margin: 0;
          }
          html {
            -webkit-print-color-adjust: exact;
            margin: 0;
          }
          body {
            margin: 0;
            color: white;
          //   position: absolute;
          //   z-index: 9999;
          //   top: 0;
          //   background-image: url('https://bumping-files.s3.ap-east-1.amazonaws.com/uploads/59tytdtbrasdo2slf2m80-Bump-bump-imageimage.JPEG'), linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5));
          //   background-size:  0 0/100% 100vh;
          //   background-repeat: repeat;
          //   background-position: fixed; 
          }
          #bodydiv {
            margin: 0;
          }
          #contentwrapper {
            padding-left: 50px;
            padding-right: 50px;
            padding-top: 0px;
            padding-bottom: 0px;
          }
          img {
            border-radius: 15px;
            width: 100%;
            height: auto;
          }
          .pline {
            display: inline;
          }
          .headerbox {
            background-color: rgba(0,0,0,.5);
            color: #fff;
            border-radius: 15px;
            margin-left: 25px;
            padding-left: 25px;
            margin-right: 25px;
            padding-right: 25px;
            padding-bottom: 10px;
            margin-top: 20px;
            padding-top: 10px;
          }
        `
      })
      
      // we have compile our code with handlebars
      const template = hb.compile(data, { strict: true });
      const result = template(data);
      const html = result;
      console.log("Compiling the template with handlebars", count++, html);
      // We set the page content as the generated html by handlebars
      await page.setContent(html, {
        waitUntil: 'networkidle0', // wait for page to load completely
      });
    } else {
      await page.goto(file.url, {
        waitUntil: 'networkidle0', // wait for page to load completely
      });
    }
    let pdfObj = JSON.parse(JSON.stringify(file));
    delete pdfObj['content'];
    pdfObj['buffer'] = Buffer.from(Object.values(await page.pdf(options)));
    pdfs.push(pdfObj);
  }

  return Promise.resolve(pdfs)
    .then(async function(data) {
       await browser.close();
       return data;
    }).asCallback(callback);
}

module.exports.generatePdf = generatePdf;
module.exports.generatePdfs = generatePdfs;
