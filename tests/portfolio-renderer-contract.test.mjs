import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
test('Portfolio renderer derives all user text from resolved PDF artist profile',()=>{
 const renderer=readFileSync(new URL('../src/features/portfolio/templates/PortfolioTemplateSite.jsx',import.meta.url),'utf8')
 assert.match(renderer,/resolveArtistPortfolio\(template,instance,profile\)/)
 assert.doesNotMatch(renderer,/Long Nhật Singer|CV\s*\&\s*Portfolio|GALA DINNER/)
 assert.match(renderer,/pt-fx--has-photo/)
})
test('Only decorative image duplicate is blurred; original photos remain sharp',()=>{
 const effects=readFileSync(new URL('../src/features/portfolio/templates/portfolio-effects.css',import.meta.url),'utf8')
 assert.match(effects,/\.pt-fx__ambient img\s*\{/)
 assert.match(effects,/filter:blur\(/)
 assert.match(effects,/\.pt-site__media-tile img\s*\{/)
 assert.match(effects,/filter:none!important;opacity:1!important/)
 assert.match(effects,/@media\(prefers-reduced-motion:reduce\)/)
})
test('Each shared template section can choose a visual effect without modifying artist images',()=>{
 const manager=readFileSync(new URL('../src/features/portfolio/templates/PortfolioTemplateManager.jsx',import.meta.url),'utf8')
 assert.match(manager,/Hiệu ứng hình \& chữ/)
 assert.match(manager,/updateSection\(i,'effect'/)
})
