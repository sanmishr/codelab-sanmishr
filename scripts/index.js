(async () => {
  let isLarge = window.innerWidth < 768;
  const toggleLarge = () => {
    document.body.classList.toggle('spectrum--large', isLarge);
    document.body.classList.toggle('spectrum--medium', !isLarge);
    if (viewer.contentDocument) {
      viewer.contentDocument.body.classList.toggle('spectrum--large', isLarge);
      viewer.contentDocument.body.classList.toggle('spectrum--medium', !isLarge);
    }
  };
  
  toggleLarge();
  
  window.addEventListener('resize', () => {
    isLarge = window.innerWidth < 768;
    
    toggleLarge();
  });
  
  let isDark;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    isDark = true;
  }
  
  document.body.classList.add(isDark ? 'spectrum--dark' : 'spectrum--light');
  
  // Navigation
  const toggleSideNav = () => {
    sideNav.classList.toggle('is-open', !sideNav.classList.contains('is-open'));
    navToggleOverlay.classList.toggle('is-open', !navToggleOverlay.classList.contains('is-open'));
    navToggleAction.setAttribute('aria-expanded', sideNav.classList.contains('is-open'));
    navToggleAction.classList.toggle('is-selected', sideNav.classList.contains('is-open'));
  };
  
  navToggleAction.addEventListener('click', toggleSideNav);
  navToggleOverlay.addEventListener('click', toggleSideNav);
  
  const getIndex = async () => {
    const manifest = await fetch('/manifest.json');
    return await manifest.json();
  };
  
  const getSrc = () => {
    return new URLSearchParams(location.search).get('src');
  };
  
  const render = async () => {
    viewer.beforeunload = () => {
      loading.hidden = false;
      viewer.hidden = true;
    };
    
    viewer.onload = () => {
      const src = viewer.contentWindow.location.href;
      
      const step = Array.from(menu.getElementsByTagName('a')).find(item => item.href.replace('?src=/', '') === src);
      if (!step.parentElement.classList.contains('is-selected')) {
        step.parentElement.classList.add('is-selected');
      }
      
      history.replaceState({href: step.href}, '', step.href);
      
      const doc = viewer.contentDocument;
      
      viewer.contentWindow.addEventListener('click', (event) => {
        if (event.target.classList.contains('nav-anchor')) {
          event.preventDefault();
          
          const nextStep = Array.from(menu.getElementsByTagName('a')).find(item => item.href === event.target.href);
          if (nextStep) {
            nextStep.click();
          }
        }
      });
      
      viewer.contentWindow.addEventListener('change', (event) => {
        if (event.target.id === 'darkSwitch') {
          isDark = event.target.checked;
          
          document.body.classList.toggle('spectrum--dark', isDark);
          document.body.classList.toggle('spectrum--light', !isDark);
          
          if (viewer.contentDocument) {
            viewer.contentDocument.body.classList.toggle('spectrum--darkest', isDark);
            viewer.contentDocument.body.classList.toggle('spectrum--lightest', !isDark);
          }
        }
      });
      
      transformLab(doc);
      
      loading.hidden = true;
      viewer.hidden = false;
    };
    
    viewer.src = menu.querySelector('.is-selected a').href.replace('?src=/', '');
    
    requestAnimationFrame(() => {
      if (sideNav.classList.contains('is-open')) {
        toggleSideNav();
        navToggleAction.focus();
      }
    });
  };
  
  const transformLab = (doc) => {
    const src = getSrc();
    const path = `${location.protocol}//${location.host}`;
    const header = doc.body.querySelector('header');
    const footer = doc.body.querySelector('footer');
    const main = doc.body.querySelector('main');
    
    const spectrumify = (selectors, className) => {
      selectors.split(',').forEach((name) => {
        for (const el of main.querySelectorAll(name)) {
          el.classList.add(...className.split(' '));
        }
      });
    };
    
    // Transform relative paths to absolute
    for (const anchor of main.querySelectorAll('a[href]')) {
      if (anchor.href.startsWith(path)) {
        anchor.classList.add('nav-anchor');
        anchor.setAttribute('href', `${path}?src=${anchor.href.replace(path, '')}`);
      }
      else {
        // Force target blank
        anchor.setAttribute('target', '_blank');
      }
    }
    
    spectrumify('h1', 'spectrum-Heading spectrum-Heading--XXL');
    spectrumify('h2', 'spectrum-Heading spectrum-Heading--XL');
    spectrumify('h3', 'spectrum-Heading spectrum-Heading--L');
    spectrumify('h4', 'spectrum-Heading spectrum-Heading--M');
    spectrumify('h5', 'spectrum-Heading spectrum-Heading--S');
    spectrumify('h6', 'spectrum-Heading spectrum-Heading--XS');
    spectrumify('code', `spectrum-Code spectrum-Code--S`);
    spectrumify('p, ol, ul', `spectrum-Body spectrum-Body--M`);
    spectrumify('p > code', 'spectrum-Well');
    spectrumify('table', 'spectrum-Table');
    spectrumify('thead', 'spectrum-Table-head');
    spectrumify('tbody', 'spectrum-Table-body');
    spectrumify('tbody tr', 'spectrum-Table-row');
    spectrumify('th', 'spectrum-Table-headCell');
    spectrumify('td', 'spectrum-Table-cell');
    spectrumify('a', 'spectrum-Link');
    
    const titles = [];
    for (const title of doc.body.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
      titles.push({
        label: title.textContent.trim(),
        url: `#${title.id}`
      });
    }
    
    main.insertAdjacentHTML('beforeend', `
      <div class="heading-anchors">
        <h3 class="spectrum-Detail spectrum-Detail--M">On this page</h3>
        <ul>
          ${titles.map(title => `<li><a class="spectrum-Link" href="${title.url}">${title.label}</a></li>`).join('')}
        </ul>
      </div>
    `);
    
    doc.body.className = `spectrum spectrum-Typography ${isDark ? 'spectrum--darkest' : 'spectrum--lightest'} ${isLarge ? 'spectrum--large' : 'spectrum--medium'}`;
    
    header.innerHTML = `
      <nav class="header-item">
        <ul class="spectrum-Breadcrumbs">
          <li class="spectrum-Breadcrumbs-item">
            <a class="spectrum-Breadcrumbs-itemLink" target="_parent" href="https://adobedocs.github.io/adobeio-developers">Adobe I/O Developers</a>
            <svg class="spectrum-Icon spectrum-UIIcon-ChevronRightSmall spectrum-Breadcrumbs-itemSeparator" focusable="false" aria-hidden="true">
              <path d="M5.5 4a.747.747 0 0 0-.22-.53C4.703 2.862 3.242 1.5 2.04.23A.75.75 0 1 0 .98 1.29L3.69 4 .98 6.71a.75.75 0 1 0 1.06 1.06l3.24-3.24A.747.747 0 0 0 5.5 4z"></path>
            </svg>
          </li>
          <li class="spectrum-Breadcrumbs-item">
            <a class="spectrum-Breadcrumbs-itemLink" target="_parent" href="${path}?src=/README.html">${index.title}</a>
            <svg class="spectrum-Icon spectrum-UIIcon-ChevronRightSmall spectrum-Breadcrumbs-itemSeparator" focusable="false" aria-hidden="true">
              <path d="M5.5 4a.747.747 0 0 0-.22-.53C4.703 2.862 3.242 1.5 2.04.23A.75.75 0 1 0 .98 1.29L3.69 4 .98 6.71a.75.75 0 1 0 1.06 1.06l3.24-3.24A.747.747 0 0 0 5.5 4z"></path>
            </svg>
          </li>
          <li class="spectrum-Breadcrumbs-item">
            <a class="spectrum-Breadcrumbs-itemLink" target="_parent" href="${location}" aria-current="page">${menu.querySelector('.is-selected').textContent.trim()}</a>
          </li>
        </ul>
      </nav>
  
      <div class="header-item">
        <div class="spectrum-ToggleSwitch">
          <input type="checkbox" class="spectrum-ToggleSwitch-input" id="darkSwitch" ${isDark ? 'checked' : ''}>
          <span class="spectrum-ToggleSwitch-switch"></span>
          <label class="spectrum-ToggleSwitch-label" for="darkSwitch">Dark mode</label>
        </div>
        <a role="button" href="${index.repository}/issues/new?body=Issue%20in%20${src.replace('.html', '.md')}" target="_blank" class="spectrum-Button spectrum-Button--primary">
          <span class="spectrum-Button-label">Log an issue</span>
        </a>
        <a role="button" href="${index.repository}/blob/master${src.replace('.html', '.md')}" target="_blank" class="spectrum-Button spectrum-Button--cta">
          <span class="spectrum-Button-label">Edit in Github</span>
        </a>
      </div>
    `;
    
    footer.innerHTML = `
      <hr class="footer-rule spectrum-Rule spectrum-Rule--medium" />
      <ul>
        <li>
          © Adobe. All rights reserved.
        </li>
        <li>
          <a class="spectrum-Link spectrum-Link--quiet" href="https://www.adobe.com/privacy.html">Privacy (Updated)</a>
        </li>
        <li>
          <a class="spectrum-Link spectrum-Link--quiet" href="https://www.adobe.com/legal/terms.html">Terms of use</a>
        </li>
        <li>
          <a class="spectrum-Link spectrum-Link--quiet" href="https://www.adobe.com/privacy/cookies.html">Cookies</a>
        </li>
        <li>
          <a class="spectrum-Link spectrum-Link--quiet" href="https://www.adobe.com/privacy/ca-rights.html">Do not sell my personal information</a>
        </li>
      </ul>
    `;
    footer.classList.add('footer');
  };
  
  window.onpopstate = (event) => {
    const step = Array.from(menu.getElementsByTagName('a')).find(item => item.href === event.state.href);
    if (!step.parentElement.classList.contains('is-selected')) {
      step.click();
    }
  };
  
  menu.addEventListener('click', async (event) => {
    if (event.target.tagName === 'A') {
      event.preventDefault();
      
      viewer.hidden = true;
      loading.hidden = false;
      
      // Update selection
      const selected = menu.querySelector('.is-selected');
      selected && selected.classList.remove('is-selected');
      event.target.parentElement.classList.add('is-selected');
      
      // Update aria-current to reflect current page.
      const currentItem = menu.querySelector('[aria-current]');
      currentItem && currentItem.removeAttribute('aria-current');
      event.target.setAttribute('aria-current', 'page');
      
      // Update the main region to give it a unique label
      main.setAttribute('aria-label', event.target.textContent.trim());
      
      await render();
    }
  });
  
  const index = await getIndex();
  
  // Update title
  document.title += ` - ${index.title}`;
  // todo Update description
  // todo Update author
  
  // Create Navigation
  const src = getSrc();
  
  // Is README selected
  if (src === null || src === '/README.html') {
    const newUrl = `${location.protocol}//${location.host}${location.pathname}?src=/README.html`;
    history.replaceState({href: newUrl}, '', newUrl);
    
    const selected = menu.querySelector('.is-selected');
    selected && selected.classList.remove('is-selected');
    
    const step = menu.getElementsByTagName('li')[0];
    step.classList.add('is-selected');
    step.setAttribute('aria-current', 'page');
  }
  
  // todo Support multi-level navigation
  let steps = '';
  for (const step of index.navigation) {
    const isStepSelected = src === `${step.url}.html`;
    
    steps += `
      <li class="spectrum-SideNav-item ${isStepSelected ? 'is-selected' : ''}" href="?src=${step.url}.html" ${isStepSelected ? 'aria-current="page"' : ''}>
        <a class="spectrum-SideNav-itemLink" href="?src=${step.url}.html">${step.title}</a>
      </li>
    `;
  }
  menu.firstElementChild.insertAdjacentHTML('beforeend', steps);
  
  await render();
})();