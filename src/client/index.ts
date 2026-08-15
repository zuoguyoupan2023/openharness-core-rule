/**
 * openharness-core-rule — client half.
 *
 * Registers a `settings.section` row (byte-for-byte mirror of
 * openharness-reply-in-cn's working client; only id/label/content differ) so
 * the plugin appears in the dsh Settings sidebar as「核心铁律」.
 *
 * The actual rules text is injected by the host half.
 */

import * as React from 'react'

export const inject = []

export const SECTION_ID = 'openharness-core-rule'
export const SECTION_LABEL = () => '核心铁律'

function Section() {
  const [enabled, setEnabled] = React.useState(true)

  return React.createElement(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 0', fontSize: 14, lineHeight: 1.6 } },
    React.createElement(
      'label',
      { style: { display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' } },
      React.createElement('input', {
        type: 'checkbox',
        checked: enabled,
        onChange: (e) => setEnabled(e.target.checked),
      }),
      '注入核心底层要求：五条铁律',
    ),
    React.createElement(
      'span',
      { style: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 12 } },
      '已注入高优先级系统提示：分阶段、先问、UI 优先、可见即验收、用户确认才算完成。',
    ),
  )
}

/** Register the settings.section row, mirroring openharness-reply-in-cn. */
export function registerSettingsSection(ctx) {
  const slots = ctx.get('slots')
  if (!slots) return
  slots.inject('settings.section', () =>
    slots.register(
      { name: 'settings.section', id: SECTION_ID, order: 20, label: SECTION_LABEL },
      Section,
    ),
  )
}

export function apply(ctx) {
  ctx.effect(() => {
    try {
      registerSettingsSection(ctx)
      ctx.logger?.info?.('[openharness-core-rule] settings 侧边栏项「核心铁律」已注册')
    } catch (err) {
      // Never throw out of apply — fail-loud would crash the whole web boot.
      console.error('[openharness-core-rule] settings registration failed:', err)
    }
  }, 'openharness-core-rule: settings section')
}
