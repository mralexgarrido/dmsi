"""Optional Chromium smoke checks against dist/. Uses synthetic answers only.
Run npm run build, install scripts/browser-requirements.txt and Chromium, then run this file.
"""
from playwright.sync_api import sync_playwright, expect
import json, pathlib, threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PROJECT = pathlib.Path(__file__).resolve().parents[1]
ROOT = PROJECT / 'browser-results'
ROOT.mkdir(exist_ok=True)
server = ThreadingHTTPServer(('127.0.0.1', 4173), partial(SimpleHTTPRequestHandler, directory=str(PROJECT / 'dist')))
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:4173/'
KEY = 'dmsi-assessment-v2'
checks = []
errors = []
requests = []

def record(label):
    checks.append(label)
    print('PASS:', label, flush=True)

def response(page, index=0):
    return page.evaluate(f'JSON.parse(localStorage.getItem("{KEY}")).responses[{index}]')

def seed(context, answers, extra=None):
    state = dict(version=2, started=True, completed=True, currentQuestion=19, responses=answers)
    state.update(extra or {})
    context.add_init_script(f'if (!localStorage.getItem("{KEY}")) localStorage.setItem("{KEY}", {json.dumps(json.dumps(state))});')

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, args=['--no-sandbox'])
    ctx = browser.new_context(viewport={'width':1280,'height':900}, color_scheme='dark', reduced_motion='reduce', accept_downloads=True, permissions=['clipboard-read','clipboard-write'])
    page = ctx.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('request', lambda r: requests.append(r.url))
    page.set_default_timeout(15000)
    page.goto(BASE)
    expect(page.locator('[data-action="start"]')).to_have_text('Start the assessment')
    page.screenshot(path=str(ROOT/'dmsi-intro-desktop.png'), full_page=True)
    page.locator('[data-action="start"]').click()
    for i in [0,1,2]: page.locator(f'[data-option-index="{i}"]').click()
    assert response(page)==[0,1,2,3]
    expect(page.locator('[data-question-counter]')).to_have_text('Question 1 of 20')
    expect(page.locator('[data-selection-status]')).to_contain_text('automatically')
    record('Three clicks complete four ranks without auto-advancing')
    page.locator('[data-option-index="0"]').click()
    expect(page.locator('dialog')).to_be_visible()
    page.get_by_role('button', name='Less like me', exact=True).click()
    assert response(page)==[2,1,0,3]
    expect(page.locator('[data-option-index="0"]')).to_be_focused()
    page.locator('[data-action="undo"]').click()
    assert response(page)==[0,1,2,3]
    page.locator('[data-action="undo"]').click()
    assert response(page)==[0,1]
    page.locator('[data-option-index="2"]').click()
    page.locator('[data-action="clear-question"]').click()
    assert response(page)==[]
    page.locator('[data-action="undo"]').click()
    assert response(page)==[0,1,2,3]
    record('Rank swaps, undo of swaps and auto-fill, and clear/undo preserve other answers')
    # Undo restores focus on the next animation frame. Await that documented UI update.
    expect(page.locator('[data-question-title]')).to_be_focused()
    page.locator('[data-option-index="1"]').focus()
    expect(page.locator('[data-option-index="1"]')).to_be_focused()
    page.keyboard.press('Enter')
    expect(page.locator('dialog')).to_be_visible()
    for _ in range(8):
        page.keyboard.press('Tab')
        assert page.evaluate('document.querySelector("dialog").contains(document.activeElement)')
    page.keyboard.press('Escape')
    expect(page.locator('dialog')).not_to_be_visible()
    expect(page.locator('[data-option-index="1"]')).to_be_focused()
    record('Keyboard opens the rank editor, focus remains modal, Escape restores the triggering control')
    page.reload()
    assert response(page)==[0,1,2,3]
    expect(page.locator('[data-question-counter]')).to_have_text('Question 1 of 20')
    page.locator('[data-action="review-answers"]').first.click()
    expect(page.locator('[data-view="review"]')).to_be_visible()
    expect(page.locator('[data-action="review-results"]')).to_be_disabled()
    assert page.locator('.review-card').count()==20
    page.get_by_role('button', name='Finish ranking for question 2', exact=True).click()
    for i in [0,1,2]: page.locator(f'[data-option-index="{i}"]').click()
    expect(page.locator('[data-action="next"]')).to_have_text('Return to review')
    page.locator('[data-action="next"]').click()
    expect(page.locator('[data-view="review"]')).to_be_visible()
    page.locator('[data-action="review-resume"]').click()
    record('Reload preserves answers; incomplete review blocks results and editing returns to review')
    for q in range(2,20):
        expect(page.locator('[data-question-counter]')).to_have_text(f'Question {q+1} of 20')
        for i in [0,1,2]: page.locator(f'[data-option-index="{i}"]').click()
        page.locator('[data-action="next"]').click()
    expect(page.locator('[data-view="review"]')).to_be_visible()
    expect(page.locator('[data-action="review-results"]')).to_be_enabled()
    page.locator('[data-action="review-results"]').click()
    expect(page.locator('[data-result-title]')).to_have_text('Your primary style is Directive.')
    assert page.locator('.score-item').count()==4
    assert 'The evidence-aware driver' in page.locator('[data-blend-title]').inner_text()
    assert page.locator('[data-playbook-fields] textarea').count()==5
    record('All 20 questions complete through review into consistent results and a generated playbook')
    page.screenshot(path=str(ROOT/'dmsi-results-desktop.png'), full_page=True)
    page.locator('[data-action="jump-playbook"]').click()
    assert page.url.endswith('#results')
    expect(page.locator('#playbook-title')).to_be_focused()
    custom = 'I help us name the decision.\nI ask one useful question before we commit. <script>bad()</script>'
    page.locator('#playbook-contribution').fill(custom)
    before = page.evaluate(f'JSON.parse(localStorage.getItem("{KEY}")).responses')
    page.reload()
    expect(page.locator('#playbook-contribution')).to_have_value(custom)
    assert before == page.evaluate(f'JSON.parse(localStorage.getItem("{KEY}")).responses')
    assert page.locator('script').count()==3
    record('Playbook edits survive reload, render as text, and do not change scores or answers')
    page.locator('[data-action="copy-playbook"]').click()
    assert custom in page.evaluate('navigator.clipboard.readText()')
    with page.expect_download() as info: page.locator('[data-action="download-playbook"]').click()
    download = info.value
    download.save_as(str(ROOT/'dmsi-playbook-test.txt'))
    assert custom in (ROOT/'dmsi-playbook-test.txt').read_text()
    with page.expect_download() as info: page.locator('[data-action="export"]').click()
    info.value.save_as(str(ROOT/'dmsi-results-test.txt'))
    text=(ROOT/'dmsi-results-test.txt').read_text()
    assert custom in text and '20. I dislike:' in text and 'Total: 300 / 300' in text
    record('Clipboard, playbook download, and full report contain current edited wording')
    page.locator('[data-action="review-answers"]').last.click()
    page.get_by_role('button', name='Edit ranking for question 1', exact=True).click()
    page.locator('[data-option-index="0"]').click()
    page.get_by_role('button', name='More like me', exact=True).click()
    page.locator('[data-action="next"]').click()
    page.locator('[data-action="review-results"]').click()
    expect(page.locator('[data-playbook-stale]')).to_be_visible()
    expect(page.locator('#playbook-contribution')).to_have_value(custom)
    record('Revising answers preserves custom wording and flags the stale playbook for review')
    page.once('dialog', lambda dialog: dialog.dismiss())
    page.locator('[data-playbook-context]').select_option('class')
    expect(page.locator('[data-playbook-context]')).to_have_value('work')
    expect(page.locator('#playbook-contribution')).to_have_value(custom)
    page.once('dialog', lambda dialog: dialog.accept())
    page.locator('[data-playbook-context]').select_option('class')
    assert 'next group assignment' in page.locator('#playbook-commitment').input_value()
    expect(page.locator('[data-playbook-stale]')).not_to_be_visible()
    record('Context changes protect custom wording with confirmation and support group-project drafts')
    page.locator('#playbook-contribution').fill('Print-only verification: all of this wording must remain visible.\n' * 12)
    page.emulate_media(media='print')
    expect(page.locator('#playbook-contribution')).not_to_be_visible()
    assert 'Print-only verification' in page.locator('.playbook-field .playbook-print').all_inner_texts()[1]
    assert page.locator('.playbook-field .playbook-print').first.is_visible()
    page.emulate_media(media='screen')
    record('Print layout uses the full text rather than clipping editable textareas')
    page.once('dialog', lambda dialog: dialog.dismiss())
    page.locator('[data-action="restart"]').click()
    expect(page.locator('[data-view="results"]')).to_be_visible()
    page.once('dialog', lambda dialog: dialog.accept())
    page.locator('[data-action="restart"]').click()
    assert page.evaluate(f'localStorage.getItem("{KEY}")') is None
    expect(page.locator('[data-action="start"]')).to_have_text('Start the assessment')
    record('Clear-data confirmation preserves data on cancel and removes assessment and playbook on acceptance')
    ctx.close()
    # Complete responses created by the old version, including a fully tied profile.
    for width, scheme in [(390,'dark'),(320,'light'),(768,'light'),(1440,'dark')]:
        c=browser.new_context(viewport={'width':width,'height':844}, color_scheme=scheme, reduced_motion='reduce')
        answers=[[((i+q)%4) for i in range(4)] for q in range(20)]
        seed(c,answers)
        p=c.new_page(); p.on('pageerror', lambda e: errors.append(str(e)))
        p.goto(BASE+'#results')
        expect(p.locator('[data-result-title]')).to_contain_text('Directive + Analytical + Conceptual + Behavioral')
        assert p.locator('[data-strength-list] li').count()==8
        assert p.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert all(p.locator(f'#playbook-{k}').input_value() for k in ['contribution','needs','practice','question','commitment'])
        if width==390:
            p.screenshot(path=str(ROOT/'dmsi-results-mobile.png'),full_page=True)
            p.locator('[data-action="jump-playbook"]').click()
            p.screenshot(path=str(ROOT/'dmsi-playbook-mobile.png'))
            p.locator('[data-action="review-answers"]').last.click()
            p.get_by_role('button',name='Edit ranking for question 1',exact=True).click()
            p.locator('[data-option-index="0"]').click()
            p.screenshot(path=str(ROOT/'dmsi-rank-editor-mobile.png'))
        if width==320:
            p.locator('[data-action="review-answers"]').last.click()
            assert p.evaluate('document.documentElement.scrollWidth <= innerWidth')
            p.get_by_role('button',name='Edit ranking for question 1',exact=True).click()
            assert p.evaluate('document.documentElement.scrollWidth <= innerWidth')
            p.screenshot(path=str(ROOT/'dmsi-ranking-mobile-light.png'),full_page=True)
        c.close()
    record('Old saved responses load correctly, four-way ties stay balanced, and 320/390/768/1440px layouts do not overflow')
    c=browser.new_context(viewport={'width':390,'height':844})
    c.add_init_script('Storage.prototype.setItem = function() { throw new DOMException("Blocked", "QuotaExceededError"); };')
    p=c.new_page(); p.on('pageerror', lambda e: errors.append(str(e))); p.goto(BASE)
    p.locator('[data-action="start"]').click()
    expect(p.locator('[data-storage-status]')).to_be_visible()
    for i in [0,1,2]: p.locator(f'[data-option-index="{i}"]').click()
    expect(p.locator('[data-action="next"]')).to_be_enabled()
    p.locator('[data-action="save-exit"]').click()
    expect(p.locator('[data-resume-note]')).to_contain_text('available in this tab')
    assert 'is saved on this device' not in p.locator('[data-resume-note]').inner_text()
    record('Blocked browser saving is disclosed while the assessment remains usable')
    c.close()
    c=browser.new_context()
    c.add_init_script(f'localStorage.setItem("{KEY}", "null")')
    p=c.new_page(); p.on('pageerror', lambda e: errors.append(str(e))); p.goto(BASE)
    expect(p.locator('[data-action="start"]')).to_have_text('Start the assessment')
    record('Malformed saved state is handled without crashing')
    c.close()
    browser.close()
assert not errors, errors
assert not [url for url in requests if not url.startswith(BASE)], requests
record('No uncaught browser errors or external runtime requests in the exercised flow')
server.shutdown()
(ROOT/'dmsi-browser-results.json').write_text(json.dumps({'checks':checks,'errors':errors,'externalRequests':[]},indent=2))
print(json.dumps({'passed':len(checks),'errors':errors}))
