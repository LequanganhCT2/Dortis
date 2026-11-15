import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveRoute, resolveAdminView, ROUTES, authRedirect } from '../src/app/routes.js'
import { canManageContent, roleFromUser, ROLES } from '../src/core/auth/roles.js'
import { canPublishPortfolio, LONG_NHAT_PORTFOLIO, PORTFOLIO_REQUIREMENTS } from '../src/features/portfolio/long-nhat/data.js'

test('Routes separate Guest, Admin and unpublished artist portfolio',()=>{
  assert.equal(resolveRoute('/'), 'home')
  assert.equal(resolveRoute('/login'), 'login')
  assert.equal(resolveRoute('/login/'), 'login')
  assert.equal(ROUTES.login,'/login')
  assert.equal(resolveRoute('/admin'), 'admin')
  assert.equal(resolveRoute('/admin/media'), 'admin')
  assert.equal(resolveRoute('/admin/portfolio'), 'admin')
  assert.equal(resolveRoute('/artists/test-artist'), 'artists')
  assert.equal(resolveRoute('/portfolio/long-nhat'), 'portfolio-unpublished')
  assert.equal(resolveRoute('/unknown'), 'not-found')
  assert.equal(resolveAdminView(ROUTES.portfolio), 'artists')
  assert.equal(resolveAdminView(ROUTES.media), 'media')
  assert.equal(resolveAdminView(ROUTES.admin), 'overview')
  assert.equal(resolveAdminView(ROUTES.artists), 'artists')
})

test('Guest cannot manage content; only app_metadata admin is trusted',()=>{
  assert.equal(roleFromUser(null), ROLES.GUEST)
  assert.equal(canManageContent(null), false)
  assert.equal(canManageContent({id:'guest',user_metadata:{role:'admin'}}), false)
  assert.equal(canManageContent({id:'guest',app_metadata:{role:'user'}}), false)
  assert.equal(canManageContent({id:'user-1',app_metadata:{role:'admin'}}), true)
})

test('Long Nhật remains unpublished while inputs and approvals are missing',()=>{
  assert.equal(LONG_NHAT_PORTFOLIO.sourcePortfolio, null)
  assert.equal(LONG_NHAT_PORTFOLIO.published, false)
  assert.equal(canPublishPortfolio(), false)
  assert.equal(PORTFOLIO_REQUIREMENTS.length, 6)
  assert.equal(canPublishPortfolio({...LONG_NHAT_PORTFOLIO,published:true}), false)
})

test('Guest and Admin auth redirects preserve the intended URL split',()=>{
  assert.equal(authRedirect('admin',true,false),null)
  assert.equal(authRedirect('admin',false,false),'/login')
  assert.equal(authRedirect('admin',false,true),null)
  assert.equal(authRedirect('login',false,true),'/admin')
  assert.equal(authRedirect('login',false,false),null)
})
