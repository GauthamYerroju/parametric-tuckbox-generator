let form;
let preview;
let output;
let ctx;
let scale;
let download;

const DPI = 300
// All the below are in inches
const PAGE_WIDTH = 8.5
const PAGE_HEIGHT = 11
const MARGIN_X = 0.3
const MARGIN_Y = 0.3
const LINE_WIDTH = 0.02

window.addEventListener('load', () => {
  form = document.querySelector('form')

  download = document.getElementById('download')
  download.style.visibility = 'hidden'

  const previewContainer = document.getElementById('preview')
  setScale()
  preview = createHiDPICanvas(PAGE_WIDTH * scale, PAGE_HEIGHT * scale)
  previewContainer.append(preview)
  ctx = preview.getContext('2d')

  output = createHiDPICanvas(PAGE_WIDTH * DPI, PAGE_HEIGHT * DPI)

  // window.addEventListener('resize', resizePreview)
  form.addEventListener('change', async (ev) => {
    // Show sub-options based on current selections
    // const data = await readForm()
    // if (data.sleeveMode) {
    //   document.querySelector('.ez-open-container').style.display = 'none'
    //   document.querySelector('.open-side-container').style.display = 'initial'
    // } else {
    //   document.querySelector('.ez-open-container').style.display = 'initial'
    //   document.querySelector('.open-side-container').style.display = 'none'
    // }

    // Hide download button
    download.removeAttribute("href")
    download.style.visibility = 'hidden'

    // Show current filenames
    if (ev.target.type == 'file') {
      const side = ev.target.name
      form.querySelector(`#${side}Filename`).innerHTML = ev.target.files[0].name
    }

    draw(ctx, scale)
  })

  const allStepHeaders = form.querySelectorAll('summary.step')

  allStepHeaders.forEach(el => {
    el.addEventListener('click', ev => {
      ev.preventDefault()
      const willBeOpen = !el.parentElement.hasAttribute('open') // Flipping condition because default behavior happens after handler.
      allStepHeaders.forEach(el2 => {
        if (el == el2 && willBeOpen) {
          el2.classList.remove('secondary', 'outline')
          el2.parentNode.setAttribute('open', '')
        } else {
          el2.classList.add('secondary', 'outline')
          el2.parentNode.removeAttribute('open')
        }
      })
    })
  })

  document.getElementById('dark-mode').addEventListener('click', ev => {
    const mode = ev.target.value
    let newMode;
    if (mode === '') {
      newMode = 'light'
    } else if (mode === 'light') {
      newMode = 'dark'
    } else {
      newMode = ''
    }
    document.querySelector('html').dataset.theme = newMode
    document.querySelector('.yinyang').classList.remove('dark', 'light')
    if (newMode !== '') {
      document.querySelector('.yinyang').classList.add(newMode)
    }
    ev.target.value = newMode
  })

  draw(ctx, scale)
})

function setScale() {
  // scale = DPI
  // return
  let { clientWidth: w, clientHeight: h } = document.getElementById('preview')
  const { clientHeight: formHeight } = form
  if (h > formHeight) {
    h = formHeight
  }
  if (w > h) {
    scale = h / PAGE_HEIGHT
  } else {
    scale = w / PAGE_WIDTH
  }
  console.log("Scale:", scale, w, h)
}

function resizePreview() {
  setScale()
  const w = PAGE_WIDTH * scale
  const h = PAGE_HEIGHT * scale
  preview.width = w
  preview.height = h
  preview.style.width = w
  preview.style.height = h
  draw(ctx, scale)
}

async function generate() {
  await draw(output.getContext('2d'), DPI)
  download.href = output.toDataURL("image/png")
  download.style.visibility = 'initial'
}

async function draw(ctx, scale) {
  const canvas = ctx.canvas
  const data = await readForm()

  ctx.fillStyle = "white"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.strokeStyle = "black"
  ctx.setLineDash([])
  ctx.lineWidth = LINE_WIDTH * scale

  let { width: w, height: h, depth: d, left, front, top, bottom, right, back } = data

  // Left
  strokeRect(ctx, scale, 0, d + d, d, h)
  drawImage(ctx, scale, left, 0, d + d, d, h)
  // Front
  strokeRect(ctx, scale, d, d + d, w, h)
  drawImage(ctx, scale, front, d, d + d, w, h)
  // Top
  strokeRect(ctx, scale, d + w + d, d, w, d)
  drawImage(ctx, scale, top, d + w + d, d, w, d)
  // Bottom
  strokeRect(ctx, scale, d, d + d + h, w, d)
  drawImage(ctx, scale, bottom, d, d + d + h, w, d)
  // Right
  strokeRect(ctx, scale, d + w, d + d, d, h)
  drawImage(ctx, scale, right, d + w, d + d, d, h)
  // Back
  strokeRect(ctx, scale, d + w + d, d + d, w, h)
  drawImage(ctx, scale, back, d + w + d, d + d, w, h)

  ctx.setLineDash([8])
  // Top Flap
  strokeRect(ctx, scale, d + w + d, 0, w, d)
  // Back Flaps
  strokeRect(ctx, scale, d + w + d, d + d + h, w, d) // Bottom
  strokeRect(ctx, scale, d + w + d + w, d + d, d, h) // Side
  // Left Flaps
  strokeRect(ctx, scale, 0, d + d / 2, d, d / 2) // Top
  strokeRect(ctx, scale, 0, d + d + h, d, d / 2) // Bottom
  // Right Flaps
  strokeRect(ctx, scale, d + w, d + d / 2, d, d / 2) // Top
  strokeRect(ctx, scale, d + w, d + d + h, d, d / 2) // Bottom
}

function strokeRect(ctx, scale, x, y, w, h) {
  ctx.strokeRect((MARGIN_X + x) * scale, (MARGIN_Y + y) * scale, w * scale, h * scale)
}
function drawImage(ctx, scale, img, x, y, w, h) {
  if (img) {
    ctx.drawImage(img, (MARGIN_X + x) * scale, (MARGIN_Y + y) * scale, w * scale, h * scale)
  }
}

async function readForm() {
  const formData = new FormData(form)
  const data = Object.fromEntries(formData.entries())
  const result = {
    // Page settings
    size: data.size ? data.size : null,
    orientaion: data.orientation,
    dpi: data.dpi ? parseInt(data.dpi) : null,
    // Box settings
    width: data.width ? parseFloat(data.width) : null,
    height: data.height ? parseFloat(data.height) : null,
    depth: data.depth ? parseFloat(data.depth) : null,
    sleeveMode: Boolean(data.sleeveMode),
    openSide: data.openSide,
    ezOpen: Boolean(data.ezOpen),
    // Image settings
    bgColor: data.bgColor ? data.bgColor : null,
    front: data.front.name ? (await makeImage(data.front)) : null,
    back: data.back.name ? (await makeImage(data.back)) : null,
    left: data.left.name ? (await makeImage(data.left)) : null,
    right: data.right.name ? (await makeImage(data.right)) : null,
    top: data.top.name ? (await makeImage(data.top)) : null,
    bottom: data.bottom.name ? (await makeImage(data.bottom)) : null,
    frontRotation: 90 * parseInt(data.frontRotation),
    backRotation: 90 * parseInt(data.backRotation),
    leftRotation: 90 * parseInt(data.leftRotation),
    rightRotation: 90 * parseInt(data.rightRotation),
    topRotation: 90 * parseInt(data.topRotation),
    bottomRotation: 90 * parseInt(data.bottomRotation),
  }
  console.log(form, data, result)
  return result
}

// https://stackoverflow.com/questions/15661339/how-do-i-fix-blurry-text-in-my-html5-canvas
function getPixelRatio(ctx) {
  const dpr = window.devicePixelRatio || 1
  const bsr = ctx.webkitBackingStorePixelRatio ||
    ctx.mozBackingStorePixelRatio ||
    ctx.msBackingStorePixelRatio ||
    ctx.oBackingStorePixelRatio ||
    ctx.backingStorePixelRatio || 1

  console.log(dpr, bsr)
  console.log('Pixel Ratio:', dpr / bsr)
  return dpr / bsr
}

function createHiDPICanvas(w, h, ratio) {
  const can = document.createElement("canvas");
  if (!ratio) {
    ratio = getPixelRatio(can.getContext('2d'))
  }
  can.width = w * ratio;
  can.height = h * ratio;
  can.style.width = w + "px";
  can.style.height = h + "px";
  can.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
  return can;
}

// https://stackoverflow.com/questions/46399223/async-await-in-image-loading
async function makeImage(src) {
  return new Promise((resolve, reject) => {
    let img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      console.log('Error with making image')
      reject()
    }
    img.src = URL.createObjectURL(src)
  })
}

function uploadImage(side) {
  form.querySelector(`[type="file"][name="${side}"]`).click()
}

function removeImage(side) {
  form.querySelector(`[name="${side}"]`).value = null
  form.querySelector(`#${side}Filename`).innerHTML = null
  draw(ctx, scale)
}

function rotateImage(side) {
  console.log(side, `[name="${side}Rotation"]`)
  const el = form.querySelector(`[name="${side}Rotation"]`)
  let rotation = parseInt(el.value)
  rotation = (rotation + 1) % 4
  el.value = rotation
  draw(ctx, scale)
}

