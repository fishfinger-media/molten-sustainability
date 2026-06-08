import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'

const lenis = new Lenis({
  autoRaf: false,
  allowNestedScroll: true,
})

gsap.registerPlugin(ScrollTrigger, SplitText)

lenis.on('scroll', ScrollTrigger.update)

gsap.ticker.add((time) => {
  lenis.raf(time * 1000)
})
gsap.ticker.lagSmoothing(0)

ScrollTrigger.scrollerProxy(document.documentElement, {
  scrollTop(value) {
    if (arguments.length) {
      lenis.scrollTo(value, { immediate: true })
    }
    return lenis.scroll
  },
  getBoundingClientRect() {
    return {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    }
  },
})

ScrollTrigger.addEventListener('refresh', () => {
  lenis.resize()
})

// ─── Shared animation presets ───────────────────────────────────────────────

const SPLIT_LINES = { type: 'lines', mask: 'lines', linesClass: 'split-line' }

const HEADLINE_OUT = { yPercent: 108, opacity: 0, filter: 'blur(10px)' }
const HEADLINE_IN = {
  yPercent: 0,
  opacity: 1,
  filter: 'blur(0px)',
  duration: 1.15,
  stagger: 0.11,
  ease: 'power4.out',
}
const BODY_OUT = { yPercent: 100, opacity: 0 }
const BODY_IN = {
  yPercent: 0,
  opacity: 1,
  duration: 0.95,
  stagger: 0.06,
  ease: 'power3.out',
}
const FADE_OUT = { opacity: 0, duration: 0.45, stagger: 0.03, ease: 'power2.in' }
const ITEM_OUT = { y: 56, opacity: 0, scale: 1.04 }
const ITEM_IN = { y: 0, opacity: 1, scale: 1, duration: 1.15, ease: 'power4.out' }
const BUTTON_OUT = { y: 28, opacity: 0 }
const BUTTON_IN = { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const isMobile = window.matchMedia('(max-width: 991px)').matches

function setSplitImageOut(image, imageFromRight) {
  if (!image) return
  gsap.set(
    image,
    isMobile
      ? { x: 0, y: 40, opacity: 0, scale: 1.04 }
      : { x: imageFromRight ? 72 : -72, y: 0, opacity: 0, scale: 1.04 },
  )
}

const SPLIT_IMAGE_IN = isMobile
  ? { x: 0, y: 0, opacity: 1, scale: 1, duration: 1.15, ease: 'power4.out' }
  : { x: 0, opacity: 1, scale: 1, duration: 1.15, ease: 'power4.out' }

function splitLines(el) {
  return el ? SplitText.create(el, SPLIT_LINES) : null
}

function setHeadlineOut(lines) {
  if (lines?.length) gsap.set(lines, HEADLINE_OUT)
}

function setBodyOut(lines) {
  if (lines?.length) gsap.set(lines, BODY_OUT)
}

function addHeadlineIn(tl, lines, at = 0) {
  if (lines?.length) tl.to(lines, HEADLINE_IN, at)
}

function addBodyIn(tl, lines, at) {
  if (lines?.length) tl.to(lines, BODY_IN, at)
}

function addItemsIn(tl, items, at, stagger) {
  if (items?.length) tl.to(items, { ...ITEM_IN, stagger }, at)
}

// Single refresh bus instead of one listener per section
const refreshHandlers = new Set()
ScrollTrigger.addEventListener('refresh', () => {
  refreshHandlers.forEach((fn) => fn())
})

function bindScrollReveal({ trigger, start, end, playIn, playOut, setOut }) {
  const st = ScrollTrigger.create({
    trigger,
    start,
    end,
    onEnter: playIn,
    onEnterBack: playIn,
    onLeave: playOut,
    onLeaveBack: playOut,
  })

  refreshHandlers.add(() => {
    if (st.isActive) playIn()
    else setOut()
  })

  if (st.isActive) playIn()
}

function createRevealController(animTargets) {
  let timeline = null

  const kill = () => {
    gsap.killTweensOf(animTargets)
    timeline?.kill()
  }

  const playOut = (setOut) => {
    timeline?.kill()
    timeline = gsap.timeline({
      defaults: { ease: 'power2.in' },
      onComplete: setOut,
    }).to(animTargets, FADE_OUT)
  }

  const playIn = (setOut, buildTimeline) => {
    timeline?.kill()
    setOut()
    timeline = gsap.timeline({ defaults: { ease: 'power4.out' } })
    buildTimeline(timeline)
    return timeline
  }

  return { kill, playIn, playOut }
}

function skipReveal(section, readyClass, animatedClass, onSkip) {
  section.classList.add(readyClass, animatedClass)
  onSkip?.()
}

// ─── Section init ───────────────────────────────────────────────────────────

function initSectionBodyColors() {
  const sections = document.querySelectorAll('[data-color]')
  if (!sections.length) return

  const setBodyColor = (hex) => {
    gsap.to(document.body, {
      backgroundColor: hex,
      duration: 0.6,
      ease: 'power2.out',
      overwrite: 'auto',
    })
  }

  const firstColor = sections[0].dataset.color
  if (firstColor) gsap.set(document.body, { backgroundColor: firstColor })

  sections.forEach((section) => {
    const color = section.dataset.color
    if (!color) return

    ScrollTrigger.create({
      trigger: section,
      start: 'top 40%',
      end: 'bottom 45%',
      onEnter: () => setBodyColor(color),
      onEnterBack: () => setBodyColor(color),
    })
  })
}

function initNavigationEntrance() {
  const nav = document.querySelector('.navigation')
  if (!nav) return

  if (reducedMotion) {
    nav.classList.add('is-nav-ready', 'is-nav-animated')
    gsap.set(nav, { clearProps: 'all' })
    return
  }

  gsap.set(nav, { y: '-100%', opacity: 0 })
  nav.classList.add('is-nav-ready')

  gsap
    .timeline({
      delay: 0.8,
      onComplete: () => nav.classList.add('is-nav-animated'),
    })
    .to(nav, { y: 0, duration: 1.5, ease: 'power4.out' })
    .to(nav, { opacity: 1, duration: 1.35, ease: 'power2.out' }, 0)
}

function initNavigationToggle() {
  const navBtn = document.querySelector('.nav-btn')
  const navList = document.querySelector('.navigation-list')
  if (!navBtn || !navList) return

  let isOpen = false
  let toggleTween = null

  navBtn.addEventListener('click', () => {
    isOpen = !isOpen
    const y = isOpen ? '0%' : '-100%'

    toggleTween?.kill()
    if (reducedMotion) {
      gsap.set(navList, { y })
    } else {
      toggleTween = gsap.to(navList, {
        y,
        duration: 0.65,
        ease: isOpen ? 'power4.out' : 'power3.inOut',
        overwrite: 'auto',
      })
    }
    navBtn.classList.toggle('is-nav-active', isOpen)
    navList.classList.toggle('is-nav-open', isOpen)
  })
}

function initHeroEntrance() {
  const hero = document.querySelector('.section__hero')
  if (!hero) return

  const headline = hero.querySelector('.headline-jumbo')
  const subcopy = hero.querySelector('.hero-content p')
  const buttons = hero.querySelectorAll('.button')

  if (!headline) return

  if (reducedMotion) {
    hero.classList.add('is-hero-ready', 'is-hero-animated')
    gsap.set([headline, subcopy, ...buttons].filter(Boolean), { clearProps: 'all' })
    return
  }

  const headlineSplit = splitLines(headline)
  const subcopySplit = subcopy ? splitLines(subcopy) : null

  setHeadlineOut(headlineSplit.lines)
  if (subcopySplit) setBodyOut(subcopySplit.lines)
  if (buttons.length) gsap.set(buttons, BUTTON_OUT)

  hero.classList.add('is-hero-ready')

  const tl = gsap.timeline({ defaults: { ease: 'power4.out' }, delay: 0.15 })

  addHeadlineIn(tl, headlineSplit.lines, 0)

  if (subcopySplit?.lines?.length) {
    addBodyIn(tl, subcopySplit.lines, 0.42)
  } else if (subcopy) {
    gsap.set(subcopy, { y: 20, opacity: 0 })
    tl.to(subcopy, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }, 0.42)
  }

  if (buttons.length) {
    tl.to(
      buttons,
      { ...BUTTON_IN, stagger: 0.05 },
      subcopy || subcopySplit ? 0.72 : 0.55,
    )
  }

  hero.classList.add('is-hero-animated')
}

function getSplitSectionElements(section) {
  if (section.classList.contains('section__split-chart')) {
    return {
      image: section.querySelector('.chart-bar_w'),
      eyebrow: null,
      headline: section.querySelector('.split-chart-c h2'),
      body: section.querySelector('.split-chart-c p'),
      button: null,
      imageFromRight: true,
    }
  }

  return {
    image: section.querySelector('.split-image'),
    eyebrow: section.querySelector('.split-content__c .paragraph-large'),
    headline: section.querySelector('.split-content__c .headline-4'),
    body: section.querySelector('.split-content__c > p'),
    button: section.querySelector('.split-content__c .button'),
    imageFromRight: section.getAttribute('data-wf--split-image--variant') === 'right',
  }
}

function initSplitSections() {
  const sections = document.querySelectorAll('.section__split, .section__split-chart')
  if (!sections.length) return

  sections.forEach((section) => {
    const { image, eyebrow, headline, body, button, imageFromRight } =
      getSplitSectionElements(section)

    if (!headline) return

    if (reducedMotion) {
      skipReveal(section, 'is-split-ready', 'is-split-animated')
      return
    }

    const headlineSplit = splitLines(headline)
    const bodySplit = splitLines(body)

    const animTargets = [
      ...headlineSplit.lines,
      ...(bodySplit?.lines || []),
      eyebrow,
      button,
      image,
    ].filter(Boolean)

    const { kill, playIn, playOut } = createRevealController(animTargets)

    const setOut = () => {
      kill()
      setHeadlineOut(headlineSplit.lines)
      setBodyOut(bodySplit?.lines)
      if (eyebrow) gsap.set(eyebrow, { y: 16, opacity: 0 })
      if (button) gsap.set(button, BUTTON_OUT)
      if (image) setSplitImageOut(image, imageFromRight)
      section.classList.remove('is-split-animated')
    }

    const runIn = () => {
      playIn(setOut, (tl) => {
        if (image) tl.to(image, SPLIT_IMAGE_IN, 0)
        if (eyebrow) {
          tl.to(eyebrow, { y: 0, opacity: 1, duration: 0.75, ease: 'power3.out' }, image ? 0.18 : 0)
        }
        addHeadlineIn(tl, headlineSplit.lines, image ? 0.28 : 0.12)
        addBodyIn(tl, bodySplit?.lines, image ? 0.5 : 0.38)
        if (button) {
          tl.to(button, BUTTON_IN, image ? 0.72 : 0.58)
        }
      })
      section.classList.add('is-split-animated')
    }

    section.classList.add('is-split-ready')
    setOut()

    bindScrollReveal({
      trigger: section,
      start: 'top 45%',
      end: 'bottom 22%',
      playIn: runIn,
      playOut: () => playOut(setOut),
      setOut,
    })
  })
}

const playedDonutCharts = new WeakSet()

function playDonutChart(chartEl) {
  if (!chartEl || playedDonutCharts.has(chartEl)) return
  playedDonutCharts.add(chartEl)
  chartEl.dispatchEvent(
    new CustomEvent('molten-donut:play', { bubbles: true, composed: true }),
  )
}

function scheduleDonutPlay(gridItem, delay) {
  gsap.delayedCall(delay, () => {
    const existing = gridItem.querySelector('[data-molten-donut]')
    if (existing) {
      playDonutChart(existing)
      return
    }

    const observer = new MutationObserver(() => {
      const chartEl = gridItem.querySelector('[data-molten-donut]')
      if (!chartEl) return
      observer.disconnect()
      playDonutChart(chartEl)
    })

    observer.observe(gridItem, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-molten-donut'],
    })
  })
}

function initContentRevealSection({
  selector,
  readyClass,
  animatedClass,
  scrollStart,
  scrollEnd,
  getContent,
  buildTimeline,
  onReducedMotion,
}) {
  document.querySelectorAll(selector).forEach((section) => {
    const content = getContent(section)
    if (!content?.headline) return

    if (reducedMotion) {
      skipReveal(section, readyClass, animatedClass, onReducedMotion?.bind(null, section, content))
      return
    }

    const headlineSplit = splitLines(content.headline)
    const bodySplit = content.body ? splitLines(content.body) : null

    const animTargets = [
      ...headlineSplit.lines,
      ...(bodySplit?.lines || []),
      ...(content.extraTargets || []),
    ].filter(Boolean)

    const { kill, playIn, playOut } = createRevealController(animTargets)
    let sideEffectPlayed = false

    const setOut = () => {
      kill()
      setHeadlineOut(headlineSplit.lines)
      setBodyOut(bodySplit?.lines)
      content.setExtraOut?.()
      section.classList.remove(animatedClass)
    }

    const runIn = () => {
      playIn(setOut, (tl) => {
        buildTimeline(tl, { headlineSplit, bodySplit, content, section })
        if (content.onPlayIn && !sideEffectPlayed) {
          sideEffectPlayed = true
          content.onPlayIn()
        }
      })
      section.classList.add(animatedClass)
    }

    section.classList.add(readyClass)
    setOut()

    bindScrollReveal({
      trigger: section,
      start: scrollStart,
      end: scrollEnd,
      playIn: runIn,
      playOut: () => playOut(setOut),
      setOut,
    })
  })
}

function initChartSections() {
  initContentRevealSection({
    selector: '.section__chart',
    readyClass: 'is-chart-ready',
    animatedClass: 'is-chart-animated',
    scrollStart: 'top 78%',
    scrollEnd: 'bottom 22%',
    getContent: (section) => {
      const gridItems = section.querySelectorAll('.chart-grid > .card-w')
      return {
        headline: section.querySelector('.gap-1 h2'),
        body: section.querySelector('.gap-1 p'),
        extraTargets: [...gridItems],
        gridItems,
        setExtraOut() {
          if (gridItems.length) gsap.set(gridItems, ITEM_OUT)
        },
        onPlayIn() {
          gridItems.forEach((item, i) => scheduleDonutPlay(item, 0.42 + i * 0.25))
        },
      }
    },
    buildTimeline(tl, { headlineSplit, bodySplit, content }) {
      addHeadlineIn(tl, headlineSplit.lines, 0)
      addBodyIn(tl, bodySplit?.lines, 0.28)
      addItemsIn(tl, content.gridItems, 0.42, 0.25)
    },
    onReducedMotion(section, content) {
      content.gridItems.forEach((item) => scheduleDonutPlay(item, 0))
    },
  })
}

function initCardPopups() {
  const cardPopups = new WeakMap()
  const popupToCard = new WeakMap()

  document.querySelectorAll('.card-w').forEach((card) => {
    const popupWrap = card.querySelector('.popup-w')
    if (!popupWrap) return
    cardPopups.set(card, popupWrap)
    popupToCard.set(popupWrap, card)

    const scrollArea = popupWrap.querySelector('.popup-c')
    if (scrollArea) {
      scrollArea.setAttribute('data-lenis-prevent', '')
      scrollArea.setAttribute('data-lenis-prevent-touch', '')
    }
  })

  let activePopup = null
  let popupTimeline = null
  let isClosing = false

  const panelVisible = { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }
  const panelHidden = { y: 56, opacity: 0, scale: 0.96, filter: 'blur(14px)' }

  const setScrollLocked = (locked) => {
    document.documentElement.classList.toggle('is-popup-open', locked)
    if (locked) lenis.stop()
    else lenis.start()
  }

  const portalPopup = (popupWrap) => {
    if (popupWrap.parentElement === document.body) return
    document.body.appendChild(popupWrap)
    popupWrap.dataset.portaled = 'true'
  }

  const unportalPopup = (popupWrap) => {
    if (popupWrap.parentElement !== document.body) return
    const card = popupToCard.get(popupWrap)
    if (card) card.appendChild(popupWrap)
    delete popupWrap.dataset.portaled
  }

  const resetPopupStyles = (popupWrap) => {
    const panel = popupWrap.querySelector('.popup')
    gsap.set([popupWrap, panel].filter(Boolean), { clearProps: 'all' })
  }

  const finishClose = (popupWrap, onComplete) => {
    resetPopupStyles(popupWrap)
    popupWrap.style.display = 'none'
    unportalPopup(popupWrap)
    activePopup = null
    isClosing = false
    setScrollLocked(false)
    onComplete?.()
  }

  const closePopup = (popupWrap, onComplete) => {
    if (!popupWrap || popupWrap !== activePopup) {
      onComplete?.()
      return
    }
    if (isClosing) return

    popupTimeline?.kill()
    const panel = popupWrap.querySelector('.popup')

    if (!panel || reducedMotion) {
      finishClose(popupWrap, onComplete)
      return
    }

    isClosing = true

    popupTimeline = gsap
      .timeline({
        defaults: { ease: 'power3.in' },
        onComplete: () => finishClose(popupWrap, onComplete),
      })
      .to(panel, { ...panelHidden, duration: 0.42 }, 0)
      .to(
        popupWrap,
        { backgroundColor: 'rgba(0, 0, 0, 0)', duration: 0.38, ease: 'power2.in' },
        0.06,
      )
  }

  const openPopup = (popupWrap) => {
    if (activePopup === popupWrap) return

    if (activePopup && activePopup !== popupWrap) {
      closePopup(activePopup, () => openPopup(popupWrap))
      return
    }

    portalPopup(popupWrap)
    popupWrap.style.display = 'flex'
    activePopup = popupWrap
    setScrollLocked(true)

    const panel = popupWrap.querySelector('.popup')
    popupTimeline?.kill()

    if (!panel || reducedMotion) {
      gsap.set(popupWrap, { backgroundColor: 'rgba(0, 0, 0, 0.35)' })
      gsap.set(panel, panelVisible)
      return
    }

    gsap.set(popupWrap, { backgroundColor: 'rgba(0, 0, 0, 0)' })
    gsap.set(panel, panelHidden)

    popupTimeline = gsap
      .timeline({ defaults: { ease: 'power3.out' } })
      .to(
        popupWrap,
        { backgroundColor: 'rgba(0, 0, 0, 0.35)', duration: 0.55, ease: 'power2.out' },
        0,
      )
      .to(panel, { ...panelVisible, duration: 0.7 }, 0.1)
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('.card-link')
    if (link) {
      event.preventDefault()
      const card = link.closest('.card-w')
      const popupWrap = card ? cardPopups.get(card) : null
      if (popupWrap) openPopup(popupWrap)
      return
    }

    if (event.target.closest('.popup-btn_close')) {
      closePopup(event.target.closest('.popup-w'))
      return
    }

    const popupWrap = event.target.closest('.popup-w')
    if (popupWrap && event.target === popupWrap) closePopup(popupWrap)
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePopup(activePopup)
  })
}

function initDownloadsSection() {
  initContentRevealSection({
    selector: '.section__downloads',
    readyClass: 'is-downloads-ready',
    animatedClass: 'is-downloads-animated',
    scrollStart: 'top 78%',
    scrollEnd: 'bottom 22%',
    getContent: (section) => {
      const links = section.querySelectorAll('.download-link')
      return {
        headline: section.querySelector('.gap-1 h2'),
        extraTargets: [...links],
        links,
        setExtraOut() {
          if (links.length) gsap.set(links, ITEM_OUT)
        },
      }
    },
    buildTimeline(tl, { headlineSplit, content }) {
      addHeadlineIn(tl, headlineSplit.lines, 0)
      addItemsIn(tl, content.links, 0.28, 0.12)
    },
  })
}

function initCtaSection() {
  document.querySelectorAll('.section__cta').forEach((section) => {
    const eyebrow = section.querySelector('.flex-centred.gap-1 h2')
    const headline = section.querySelector('.headline-1')
    const button = section.querySelector('.button')

    if (!headline) return

    if (reducedMotion) {
      skipReveal(section, 'is-cta-ready', 'is-cta-animated')
      return
    }

    const eyebrowSplit = splitLines(eyebrow)
    const headlineSplit = splitLines(headline)

    const animTargets = [
      ...(eyebrowSplit?.lines || []),
      ...headlineSplit.lines,
      button,
    ].filter(Boolean)

    const { kill, playIn, playOut } = createRevealController(animTargets)

    const setOut = () => {
      kill()
      setBodyOut(eyebrowSplit?.lines)
      setHeadlineOut(headlineSplit.lines)
      if (button) gsap.set(button, BUTTON_OUT)
      section.classList.remove('is-cta-animated')
    }

    const runIn = () => {
      playIn(setOut, (tl) => {
        if (eyebrowSplit?.lines?.length) {
          addBodyIn(tl, eyebrowSplit.lines, 0)
        } else if (eyebrow) {
          gsap.set(eyebrow, { y: 20, opacity: 0 })
          tl.to(eyebrow, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }, 0)
        }
        addHeadlineIn(tl, headlineSplit.lines, 0.42)
        if (button) tl.to(button, { ...BUTTON_IN, stagger: 0.05 }, 0.72)
      })
      section.classList.add('is-cta-animated')
    }

    section.classList.add('is-cta-ready')
    setOut()

    bindScrollReveal({
      trigger: section,
      start: 'top 78%',
      end: 'bottom 22%',
      playIn: runIn,
      playOut: () => playOut(setOut),
      setOut,
    })
  })
}

function initQuoteSection() {
  document.querySelectorAll('.section__quote').forEach((section) => {
    const eyebrow = section.querySelector('.flex-centred.gap-1 h2')
    const headline = section.querySelector('.headline-1')
    const carousel = section.querySelector('.carousel-c')
    const glow = section.querySelector('.glow-w')

    if (!eyebrow && !headline) return

    if (reducedMotion) {
      skipReveal(section, 'is-quote-ready', 'is-quote-animated')
      return
    }

    const eyebrowSplit = splitLines(eyebrow)
    const headlineSplit = splitLines(headline)

    const animTargets = [
      ...(eyebrowSplit?.lines || []),
      ...(headlineSplit?.lines || []),
      carousel,
      glow,
    ].filter(Boolean)

    const { kill, playIn, playOut } = createRevealController(animTargets)

    const setOut = () => {
      kill()
      setHeadlineOut(eyebrowSplit?.lines)
      setHeadlineOut(headlineSplit?.lines)
      if (carousel) gsap.set(carousel, { y: 40, opacity: 0 })
      if (glow) {
        gsap.set(glow, {
          xPercent: -50,
          yPercent: -50,
          scale: 1.5,
          opacity: 0,
          filter: 'blur(24px)',
          transformOrigin: '50% 50%',
        })
      }
      section.classList.remove('is-quote-animated')
    }

    const runIn = () => {
      playIn(setOut, (tl) => {
        addHeadlineIn(tl, eyebrowSplit?.lines, 0)
        addHeadlineIn(tl, headlineSplit?.lines, 0)
        if (carousel) {
          tl.to(carousel, { y: 0, opacity: 1, duration: 0.95, ease: 'power4.out' }, 0.5)
        }
        if (glow) {
          tl.to(
            glow,
            {
              xPercent: -50,
              yPercent: -50,
              scale: 1,
              delay: 0.5,
              opacity: 1,
              filter: 'blur(0px)',
              duration: 1.35,
              ease: 'power4.out',
            },
            0,
          )
        }
      })
      section.classList.add('is-quote-animated')
    }

    section.classList.add('is-quote-ready')
    setOut()

    bindScrollReveal({
      trigger: section,
      start: 'top 40%',
      end: 'bottom 22%',
      playIn: runIn,
      playOut: () => playOut(setOut),
      setOut,
    })
  })
}

function initStatsTrack() {
  const track = document.querySelector('.stats-track')
  if (!track) return

  const glanceHeadline = track.querySelector('.stats-overlay .headline-4')
  const mainEl = track.querySelector('[data-stat="main"]')
  const infoEl = track.querySelector('[data-stat="info"]')
  const items = track.querySelectorAll('.stats-data[data-stat-data][data-stat-info]')

  if (!mainEl || !infoEl) return

  let headlineSplit = null
  let headlineAnimated = false

  if (glanceHeadline) {
    if (reducedMotion) {
      track.classList.add('is-stats-headline-ready')
    } else {
      headlineSplit = splitLines(glanceHeadline)
      setHeadlineOut(headlineSplit.lines)
      track.classList.add('is-stats-headline-ready')
    }
  }

  const animateHeadlineIn = () => {
    if (!headlineSplit?.lines?.length || headlineAnimated) return
    headlineAnimated = true
    gsap.to(headlineSplit.lines, HEADLINE_IN)
  }

  const initial = {
    main: mainEl.textContent.trim(),
    info: infoEl.textContent.trim(),
  }

  const splits = { main: null, info: null }
  let activeIndex = -1
  let statTimeline = null

  const splitElements = () => {
    splits.main?.revert()
    splits.info?.revert()

    splits.main = SplitText.create(mainEl, {
      type: 'chars',
      mask: 'chars',
      charsClass: 'split-char',
    })

    splits.info = SplitText.create(infoEl, {
      type: 'words',
      mask: 'words',
      wordsClass: 'split-word',
    })
  }

  const animateIn = () => {
    gsap.fromTo(
      splits.main.chars,
      { yPercent: 110, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.025, ease: 'power2.inout' },
    )

    gsap.fromTo(
      splits.info.words,
      { yPercent: 110, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.75,
        stagger: 0.015,
        ease: 'power3.out',
        delay: 0.08,
      },
    )
  }

  const setStat = (main, info, { animate = true } = {}) => {
    statTimeline?.kill()
    gsap.killTweensOf([...(splits.main?.chars || []), ...(splits.info?.words || [])])

    const reveal = () => {
      splits.main?.revert()
      splits.info?.revert()
      mainEl.textContent = main
      infoEl.textContent = info
      splitElements()

      if (animate) {
        animateIn()
        return
      }

      gsap.set([...splits.main.chars, ...splits.info.words], { yPercent: 0, opacity: 1 })
    }

    const outTargets =
      animate && splits.main?.chars?.length
        ? [...splits.main.chars, ...splits.info.words]
        : []

    if (!outTargets.length) {
      reveal()
      return
    }

    statTimeline = gsap
      .timeline()
      .to(outTargets, {
        yPercent: -110,
        opacity: 0,
        duration: 0.3,
        stagger: { amount: 0.12 },
        ease: 'power3.in',
      })
      .add(reveal)
  }

  splitElements()
  gsap.set([...splits.main.chars, ...splits.info.words], { yPercent: 110, opacity: 0 })
  track.classList.add('is-stats-ready')

  let initialAnimated = false
  const playInitialIn = () => {
    if (initialAnimated || activeIndex !== -1) return
    initialAnimated = true

    if (headlineSplit?.lines?.length) {
      animateHeadlineIn()
      gsap.delayedCall(0.42, animateIn)
    } else {
      animateIn()
    }
  }

  const initialTrigger = ScrollTrigger.create({
    trigger: track,
    start: 'top 30%',
    once: true,
    onEnter: playInitialIn,
  })

  refreshHandlers.add(() => {
    if (!initialAnimated && initialTrigger.isActive && activeIndex === -1) {
      playInitialIn()
    }
  })

  if (initialTrigger.isActive) playInitialIn()

  const activateStat = (index) => {
    if (activeIndex === index) return
    activeIndex = index
    setStat(items[index].dataset.statData, items[index].dataset.statInfo)
  }

  items.forEach((item, index) => {
    ScrollTrigger.create({
      trigger: item,
      start: 'top 55%',
      end: 'bottom 45%',
      onEnter: () => activateStat(index),
      onEnterBack: () => activateStat(index),
      onLeaveBack: () => {
        if (index !== 0 || activeIndex === -1) return
        activeIndex = -1
        setStat(initial.main, initial.info)
      },
    })
  })

  const section = track.closest('.section__stats')
  const dotsWrap = section?.querySelector('.stats-dots-w')
  if (!dotsWrap) return

  if (reducedMotion) {
    section.classList.add('is-stats-dots-ready')
    gsap.set(dotsWrap, { clearProps: 'all' })
    return
  }

  const DOTS_OUT = { x: -40, opacity: 0 }
  const DOTS_IN = { x: 0, opacity: 1, duration: 0.85, ease: 'power3.out' }
  const DOTS_FADE_OUT = { opacity: 0, duration: 0.45, ease: 'power2.in' }

  let dotsTimeline = null

  const killDots = () => {
    gsap.killTweensOf(dotsWrap)
    dotsTimeline?.kill()
  }

  const setDotsOut = () => {
    killDots()
    gsap.set(dotsWrap, DOTS_OUT)
  }

  const playDotsIn = () => {
    killDots()
    dotsTimeline = gsap.fromTo(dotsWrap, DOTS_OUT, DOTS_IN)
  }

  const playDotsOut = () => {
    killDots()
    dotsTimeline = gsap.timeline({
      defaults: { ease: 'power2.in' },
      onComplete: setDotsOut,
    }).to(dotsWrap, DOTS_FADE_OUT)
  }

  section.classList.add('is-stats-dots-ready')
  setDotsOut()

  bindScrollReveal({
    trigger: section,
    start: 'top 75%',
    end: 'bottom 25%',
    playIn: playDotsIn,
    playOut: playDotsOut,
    setOut: setDotsOut,
  })
}

function initButtonHovers() {
  const buttons = document.querySelectorAll('.button')
  if (!buttons.length || reducedMotion) return

  buttons.forEach((button) => {
    const label = button.querySelector(':scope > div')
    if (!label || label.dataset.buttonHoverReady === 'true') return

    label.dataset.buttonHoverReady = 'true'

    const split = SplitText.create(label, {
      type: 'words',
      mask: 'words',
      wordsClass: 'split-word',
    })

    split.words.forEach((word) => {
      const { color } = getComputedStyle(word)
      word.style.textShadow = `0 ${word.offsetHeight}px ${color}`
    })

    gsap.set(split.words, { yPercent: 0 })

    let hoverTween = null

    const setHover = (yPercent, duration, stagger, ease) => {
      hoverTween?.kill()
      hoverTween = gsap.to(split.words, {
        yPercent,
        duration,
        stagger,
        ease,
        overwrite: 'auto',
      })
    }

    button.addEventListener('mouseenter', () => setHover(-100, 0.75, 0.1, 'power3.out'))
    button.addEventListener('mouseleave', () => setHover(0, 0.65, 0.08, 'power3.inOut'))
    button.addEventListener('focusin', () => setHover(-100, 0.75, 0.1, 'power3.out'))
    button.addEventListener('focusout', () => setHover(0, 0.65, 0.08, 'power3.inOut'))
  })
}

function init() {
  initButtonHovers()
  initNavigationEntrance()
  initNavigationToggle()
  initHeroEntrance()
  initSectionBodyColors()
  initSplitSections()
  initChartSections()
  initCardPopups()
  initDownloadsSection()
  initQuoteSection()
  initCtaSection()
  initStatsTrack()

  ScrollTrigger.refresh()
}

if (document.fonts?.ready) {
  document.fonts.ready.then(init)
} else {
  init()
}
