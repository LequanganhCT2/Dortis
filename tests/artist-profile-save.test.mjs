import test from 'node:test'
import assert from 'node:assert/strict'
import {saveArtistProfile} from '../src/features/artists/application/saveArtistProfile.js'
import {createTemplate1Profile} from '../src/features/portfolio/templates/template1.js'

function database(slugs=[],writeError=null){
  const writes=[]
  return {writes,from(){
    let payload,id
    return {select(){return this},
      async like(){return {data:slugs.map(slug=>({slug})),error:null}},
      insert(value){payload=value;return this},update(value){payload=value;return this},
      eq(_,value){id=value;return this},
      async single(){writes.push({payload,id});return {data:writeError?null:{...payload,id:id||'new-profile'},error:writeError}}
    }
  }}
}
const draft=()=>({...createTemplate1Profile(),name:'La Trinh'})
test('A new Template 1 profile saves with only artist name and generates a unique slug',async()=>{
  const db=database(['la-trinh','la-trinh-2']),profile=draft()
  profile.sections[1].body='Nội dung nhập tay còn nguyên'
  const saved=await saveArtistProfile({supabase:db,userId:'admin',profile})
  assert.equal(saved.slug,'la-trinh-3')
  assert.equal(saved.status,'draft')
  assert.equal(saved.sections.length,12)
  assert.equal(saved.sections[1].body,'Nội dung nhập tay còn nguyên')
  assert.equal(saved.sections[1].name,'Hành trình âm nhạc')
  assert.equal(profile.slug,'')
  assert.equal(db.writes.length,1)
})
test('Updating an existing profile keeps its URL and updates that record only',async()=>{
  const db=database(['custom-url'])
  const saved=await saveArtistProfile({supabase:db,userId:'admin',profile:{...draft(),id:'existing',slug:'custom-url'}})
  assert.equal(saved.slug,'custom-url')
  assert.equal(db.writes[0].id,'existing')
  assert.equal(db.writes[0].payload.status,undefined)
})
test('Auth, duplicate and network failures do not masquerade as successful saves or mutate the form',async()=>{
  const profile=draft(),before=JSON.stringify(profile)
  for(const error of [{code:'42501'},{code:'23505'},{message:'Failed to fetch'}]){
    await assert.rejects(saveArtistProfile({supabase:database([],error),userId:'admin',profile}))
  }
  assert.equal(JSON.stringify(profile),before)
  const db=database()
  await assert.rejects(saveArtistProfile({supabase:db,userId:null,profile}),/đăng nhập/)
  await assert.rejects(saveArtistProfile({supabase:db,userId:'admin',profile:{...profile,name:''}}),/Tên nghệ sĩ/)
  assert.equal(db.writes.length,0)
})
