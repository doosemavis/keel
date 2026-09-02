/**
 * Preview renderers, as source text.
 *
 * Each entry is the BODY of a function `(s, h) => string` that returns the
 * preview markup for one component, where `s` is the current control state and
 * `h` escapes text. These strings are injected into the generated page and
 * compiled there with `new Function`, so the preview updates live as controls
 * change without shipping a framework to the page.
 *
 * The markup deliberately mirrors what @keel/react emits — same classes, same
 * data attributes, same ARIA. It is the one place in this repo where component
 * markup is written twice, so it carries a real risk of drift. That risk is
 * bounded on purpose: the CSS, the prop names, the default values and the
 * option lists all still come from the built packages, so a drifting preview
 * can only ever be wrong about DOM structure, never about the system's values.
 *
 * `childrenSlot` names the slot that renders as JSX children rather than an
 * attribute, which is what lets the snippet generator stay fully generic.
 */

export const RENDERERS = {
  button: {
    childrenSlot: 'label',
    body: `
      var inert = s.disabled || s.loading;
      return '<button class="keel-Button" type="button"' +
        ' data-variant="' + s.variant + '" data-size="' + s.size + '"' +
        (s.disabled ? ' data-disabled="true"' : '') +
        (s.loading ? ' data-loading="true" aria-busy="true"' : '') +
        (inert ? ' aria-disabled="true"' : '') +
        (s.fullWidth ? ' data-full-width="true"' : '') +
        '>' +
        (s.loading ? '<span class="keel-Button-spinner" aria-hidden="true"></span>' : '') +
        '<span class="keel-Button-label">' + h(s.label) + '</span>' +
        '</button>';
    `,
  },

  'text-field': {
    body: `
      var id = 'wb-tf';
      return '<div class="keel-Field"' + (s.disabled ? ' data-disabled="true"' : '') + ' style="max-inline-size:20rem">' +
        '<label class="keel-Field-label" for="' + id + '">' + h(s.label) +
          (s.required ? '<span class="keel-Field-required" aria-hidden="true">*</span>' : '') +
        '</label>' +
        '<input id="' + id + '" class="keel-Input" data-size="' + s.size + '" type="' + s.type + '"' +
          (s.placeholder ? ' placeholder="' + h(s.placeholder) + '"' : '') +
          (s.disabled ? ' aria-disabled="true" readonly' : '') +
          (s.readOnly ? ' readonly' : '') +
          (s.required ? ' aria-required="true"' : '') +
          (s.invalid ? ' aria-invalid="true"' : '') +
        '>' +
        (s.description ? '<span class="keel-Field-description">' + h(s.description) + '</span>' : '') +
        (s.invalid && s.errorMessage ? '<span class="keel-Field-error">' + h(s.errorMessage) + '</span>' : '') +
        '</div>';
    `,
  },

  select: {
    body: `
      var opts = ['United States', 'European Union', 'Asia Pacific'];
      var pop = s.open ? '<div class="keel-Select-popover" style="margin-block-start:4px">' +
          '<div class="keel-Select-list">' +
            opts.map(function (o, i) {
              return '<div class="keel-Select-option"' + (i === 0 ? ' data-focused="true"' : '') + '>' + h(o) + '</div>';
            }).join('') +
          '</div></div>' : '';
      return '<div class="keel-Field"' + (s.disabled ? ' data-disabled="true"' : '') + ' style="max-inline-size:20rem">' +
        '<span class="keel-Field-label">' + h(s.label) +
          (s.required ? '<span class="keel-Field-required" aria-hidden="true">*</span>' : '') + '</span>' +
        '<button type="button" class="keel-Select-trigger" data-size="' + s.size + '"' +
          ' aria-expanded="' + (s.open ? 'true' : 'false') + '"' +
          (s.disabled ? ' aria-disabled="true"' : '') +
          (s.invalid ? ' aria-invalid="true"' : '') +
        '>' +
          '<span class="keel-Select-value" data-placeholder>' + h(s.placeholder) + '</span>' +
          '<svg class="keel-Select-chevron" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="m3 4.5 3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' + pop +
        (s.description ? '<span class="keel-Field-description">' + h(s.description) + '</span>' : '') +
        (s.invalid && s.errorMessage ? '<span class="keel-Field-error">' + h(s.errorMessage) + '</span>' : '') +
        '</div>';
    `,
  },

  checkbox: {
    body: `
      return '<label class="keel-Choice" data-size="' + s.size + '"' +
        (s.disabled ? ' aria-disabled="true"' : '') +
        (s.invalid ? ' data-invalid="true"' : '') +
        ' data-selected="true"' + (s.indeterminate ? ' data-indeterminate="true"' : '') + '>' +
        '<span class="keel-Checkbox-box" aria-hidden="true">' +
          '<svg class="keel-Checkbox-mark" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '<span class="keel-Checkbox-dash"></span>' +
        '</span>' +
        '<span class="keel-Choice-text"><span class="keel-Choice-label">' + h(s.label) + '</span>' +
        (s.description ? '<span class="keel-Choice-description">' + h(s.description) + '</span>' : '') +
        '</span></label>';
    `,
  },

  'radio-group': {
    body: `
      var opts = [
        { l: 'Production', d: 'Live traffic. Requires approval.' },
        { l: 'Staging', d: 'Mirrors production.' },
        { l: 'Preview', d: 'One environment per pull request.' }
      ];
      return '<div class="keel-Field"' + (s.disabled ? ' data-disabled="true"' : '') + '>' +
        '<span class="keel-Field-label">' + h(s.label) +
          (s.required ? '<span class="keel-Field-required" aria-hidden="true">*</span>' : '') + '</span>' +
        (s.description ? '<span class="keel-Field-description">' + h(s.description) + '</span>' : '') +
        '<div class="keel-RadioGroup-items" data-orientation="' + s.orientation + '">' +
          opts.map(function (o, i) {
            return '<label class="keel-Choice" data-size="' + s.size + '"' +
              (i === 1 ? ' data-selected="true"' : '') +
              (s.disabled ? ' aria-disabled="true"' : '') +
              (s.invalid ? ' data-invalid="true"' : '') + '>' +
              '<span class="keel-Radio-circle" aria-hidden="true"><span class="keel-Radio-dot"></span></span>' +
              '<span class="keel-Choice-text"><span class="keel-Choice-label">' + h(o.l) + '</span>' +
              (s.orientation === 'vertical' ? '<span class="keel-Choice-description">' + h(o.d) + '</span>' : '') +
              '</span></label>';
          }).join('') +
        '</div>' +
        (s.invalid && s.errorMessage ? '<span class="keel-Field-error">' + h(s.errorMessage) + '</span>' : '') +
        '</div>';
    `,
  },

  switch: {
    body: `
      return '<label class="keel-Choice" data-size="' + s.size + '" data-label-position="' + s.labelPosition + '"' +
        ' data-selected="true"' + (s.disabled ? ' aria-disabled="true"' : '') + ' style="max-inline-size:24rem">' +
        '<span class="keel-Switch-track" aria-hidden="true"><span class="keel-Switch-knob"></span></span>' +
        '<span class="keel-Choice-text"><span class="keel-Choice-label">' + h(s.label) + '</span>' +
        (s.description ? '<span class="keel-Choice-description">' + h(s.description) + '</span>' : '') +
        '</span></label>';
    `,
  },

  alert: {
    childrenSlot: 'body',
    body: `
      var icons = {
        info: '<path d="M9 5.5v.01M9 8v4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
        success: '<path d="m5 9.3 2.6 2.6L13 6.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
        warning: '<path d="M9 6v4M9 12.5v.01" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
        danger: '<path d="m6.2 6.2 5.6 5.6M11.8 6.2l-5.6 5.6" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>'
      };
      return '<div class="keel-Alert" data-tone="' + s.tone + '" role="' + (s.tone === 'danger' ? 'alert' : 'status') + '">' +
        (s.showIcon ? '<svg class="keel-Alert-icon" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="7.25" stroke="currentColor" stroke-width="1.5"/>' + icons[s.tone] + '</svg>' : '') +
        '<div class="keel-Alert-content"><p class="keel-Alert-title">' + h(s.title) + '</p>' +
        (s.body ? '<p class="keel-Alert-body">' + h(s.body) + '</p>' : '') + '</div>' +
        (s.dismissible ? '<button type="button" class="keel-Alert-dismiss" aria-label="Dismiss"><svg viewBox="0 0 14 14" fill="none" aria-hidden="true" width="12" height="12"><path d="m3.5 3.5 7 7M10.5 3.5l-7 7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg></button>' : '') +
        '</div>';
    `,
  },

  badge: {
    childrenSlot: 'label',
    body: `
      return '<span class="keel-Badge" data-tone="' + s.tone + '" data-variant="' + s.variant + '" data-size="' + s.size + '">' +
        h(s.label) + '</span>';
    `,
  },

  card: {
    childrenSlot: 'body',
    body: `
      var tag = s.interactive ? 'button' : 'div';
      return '<' + tag + ' class="keel-Card" data-elevation="' + s.elevation + '" data-padding="' + s.padding + '"' +
        (s.interactive ? ' data-interactive="true" type="button"' : '') + ' style="max-inline-size:24rem">' +
        (s.title ? '<p class="keel-Card-title">' + h(s.title) + '</p>' : '') +
        (s.body ? '<p class="keel-Card-body">' + h(s.body) + '</p>' : '') +
        '</' + tag + '>';
    `,
  },

  avatar: {
    body: `
      var initials = s.name.trim().split(/\\s+/).filter(Boolean).slice(0, 2)
        .map(function (p) { return p[0].toUpperCase(); }).join('');
      var inner = s.src
        ? '<img class="keel-Avatar-image" src="' + h(s.src) + '" alt="">'
        : '<span aria-hidden="true">' + h(initials) + '</span>';
      return '<span class="keel-Avatar" data-size="' + s.size + '" data-shape="' + s.shape + '"' +
        ' role="img" aria-label="' + h(s.name) + '">' + inner +
        (s.showStatus ? '<span class="keel-Avatar-status" aria-hidden="true"></span>' : '') +
        '</span>';
    `,
  },

  'theme-toggle': {
    body: `
      var dark = s.theme === 'dark';
      var light = '<svg class="keel-ThemeToggle-emblem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8.4v12.4"/><path d="M12 20.8c-4-2.1-6-5.6-6-10.4"/><path d="M12 20.8c4-2.1 6-5.6 6-10.4"/><circle cx="12" cy="5" r="2.4"/><path d="M12 1.2v.9M15.6 2.6l-.6.7M8.4 2.6l.6.7"/></svg>';
      var darkSvg = '<svg class="keel-ThemeToggle-emblem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 1.8 21 7v10l-9 5.2L3 17V7z"/><path d="M7.4 8.6 12 16.4l4.6-7.8"/><path d="M9.9 8.6h4.2"/></svg>';
      var ghostL = light.replace('keel-ThemeToggle-emblem', 'keel-ThemeToggle-ghost keel-ThemeToggle-ghost--light');
      var ghostD = darkSvg.replace('keel-ThemeToggle-emblem', 'keel-ThemeToggle-ghost keel-ThemeToggle-ghost--dark');
      return '<label class="keel-ThemeToggle" data-size="' + s.size + '" data-theme-value="' + s.theme + '"' +
        (dark ? ' data-selected="true"' : '') +
        (s.disabled ? ' aria-disabled="true"' : '') +
        ' role="switch" aria-checked="' + (dark ? 'true' : 'false') + '" aria-label="' + h(s.label) + '">' +
        (s.showLabels ? '<span class="keel-ThemeToggle-text" aria-hidden="true">' + h(s.lightLabel) + '</span>' : '') +
        '<span class="keel-ThemeToggle-track" aria-hidden="true">' + ghostL + ghostD +
        '<span class="keel-ThemeToggle-knob">' + (dark ? darkSvg : light) + '</span></span>' +
        (s.showLabels ? '<span class="keel-ThemeToggle-text" aria-hidden="true">' + h(s.darkLabel) + '</span>' : '') +
        '</label>';
    `,
  },

  spinner: {
    body: `
      return '<span class="keel-Spinner" data-size="' + s.size + '" data-tone="' + s.tone + '"' +
        ' role="progressbar" aria-label="' + h(s.label) + '">' +
        '<span class="keel-Spinner-ring" aria-hidden="true"></span>' +
        (s.showLabel ? '<span class="keel-Spinner-label" aria-hidden="true">' + h(s.label) + '</span>' : '') +
        '</span>';
    `,
  },
};
