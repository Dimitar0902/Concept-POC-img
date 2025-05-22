import * as faceapi from 'face-api.js'

const video = document.getElementById('webcam')
const statusBox = document.getElementById('statusBox')
const photoBox = document.getElementById('photoBox')

// Error handler for image loading
photoBox.onerror = () => {
  console.error(`❌ Failed to load image: ${photoBox.src}`)
  photoBox.src = '/images/question.png'
  photoBox.classList.add('missing')
}

navigator.mediaDevices
  .getUserMedia({ video: { width: 640, height: 480 } })
  .then(stream => {
    video.srcObject = stream
    video.play()
    video.onloadedmetadata = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
        await faceapi.nets.faceExpressionNet.loadFromUri('/models')
        await faceapi.nets.ageGenderNet.loadFromUri('/models')
        console.log('✅ Models loaded')
        scanUserAge()
      } catch (err) {
        console.error('❌ Error loading models:', err)
        statusBox.innerText = '❌ Failed to load face detection models.'
      }
    }
  })
  .catch(err => {
    console.error('❌ Error accessing webcam:', err)
    statusBox.innerText = '❌ Unable to access the webcam.'
  })

function scanUserAge () {
  const scanTime = 8000 // Extended for more accuracy
  let ageSum = 0
  let count = 0

  console.log('📸 Starting face scan...')
  statusBox.classList.add('scanning')
  statusBox.innerText = '🔍 Scanning your face for age...'

  const interval = setInterval(async () => {
    if (video.readyState < 2) {
      console.log('⏳ Video not ready')
      return
    }

    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withAgeAndGender()

    if (detection && detection.age) {
      console.log('✅ Detection result:', detection)
      ageSum += detection.age
      count++
    } else {
      console.log('⚠️ Detection result: undefined or missing age')
    }
  }, 300)

  setTimeout(() => {
    clearInterval(interval)
    statusBox.classList.remove('scanning')
    console.log(`📊 Finished scan: count=${count}, ageSum=${ageSum}`)

    if (count > 0) {
      const avgAge = ageSum / count
      const roundedAge = Math.round(avgAge)
      console.log(`🎯 Calculated average age: ${roundedAge}`)
      showArchiveMessage(roundedAge)
    } else {
      statusBox.innerText = '❌ No face detected. Showing default archive face.'
      photoBox.src = '/images/question.png'
      photoBox.classList.add('missing')
    }
  }, scanTime)
}

function showArchiveMessage (age) {
  console.log(`🎯 Age passed to showArchiveMessage: ${age}`)

  const sampleMatches = {
    10: {
      name: 'Ruth',
      age: 10,
      story: 'Ruth, age 10, deported to Theresienstadt.',
      img: 'ruth.jpg'
    },
    18: {
      name: 'David',
      age: 18,
      story: 'David, age 18, forced into labor in 1942.',
      img: 'david.jpg'
    },
    30: {
      name: 'Miriam',
      age: 30,
      story: 'Miriam, age 30, hid her children in a cellar.',
      img: 'miriam.jpg'
    },
    45: {
      name: 'Jakob',
      age: 45,
      story: 'Jakob, age 45, survived Auschwitz.',
      img: 'jakob.jpg'
    }
  }

  const closest = Object.keys(sampleMatches)
    .map(a => parseInt(a))
    .reduce((prev, curr) =>
      Math.abs(curr - age) < Math.abs(prev - age) ? curr : prev
    )

  const match = sampleMatches[closest]
  console.log('✅ Closest match found:', match)

  if (match && match.img) {
    console.log(`🖼 Setting image source to /images/${match.img}`)
    photoBox.src = `/images/${match.img}`
    photoBox.classList.remove('missing')
  } else {
    console.warn('⚠️ No matching image found, using fallback.')
    photoBox.src = '/images/question.png'
    photoBox.classList.add('missing')
  }

  statusBox.innerText = `📍 Age detected: ${age}\n🕯 ${match.story}\nThat could have been you.`
}
