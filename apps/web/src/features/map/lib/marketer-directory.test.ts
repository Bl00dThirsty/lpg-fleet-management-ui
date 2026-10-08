import { describe, expect, it } from 'vitest'
import type { AuthUser } from '@lpg/api-client'
import type { Organization, Site, ClientSite } from '@lpg/types'
import { buildMarketerDirectory, mapCoordinates } from '../data/marketer-directory'
const organizations = [{id:'a',name:'Alpha',type:'MARKETEUR'},{id:'b',name:'Beta',type:'MARKETEUR'},{id:'c',name:'Client',type:'CLIENT'}] as Organization[]
const sites = [{id:'sa',name:'Site A',org_id:'a',is_active:true,geo_point:[11.5,3.8]},{id:'sb',name:'Site B',org_id:'b',is_active:true,geo_point:[9.7,4]}] as Site[]
const clients = [{id:'ca',name:'Client A',current_marketeur_org_id:'a',is_active:true,geo_point:[11.6,3.9]}] as ClientSite[]
describe('marketer map directory',()=>{
 it('contains only marketers and uses their actual site coordinates',()=>{const result=buildMarketerDirectory(organizations,sites,clients,{id:'admin',system_role:'ADMIN',org_type:'REGULATEUR'} as AuthUser);expect(result).toHaveLength(2);expect(result[0]!.coordinates).toEqual([11.5,3.8]);expect(result[0]!.deliveries).toHaveLength(1)})
 it('limits an agent to organizations of assigned sites',()=>{const result=buildMarketerDirectory(organizations,sites,clients,{id:'agent',system_role:'AGENT',org_type:'REGULATEUR',site_ids:['sb']} as AuthUser);expect(result.map(row=>row.organization.id)).toEqual(['b']);expect(result[0]!.deliveries).toEqual([])})
 it('does not invent coordinates or expose data without authentication',()=>{expect(mapCoordinates([Infinity,0])).toBeNull();expect(mapCoordinates([11,91])).toBeNull();expect(mapCoordinates(null)).toBeNull();expect(buildMarketerDirectory(organizations,sites,clients,null)).toEqual([])})
 it('excludes deleted and inactive sites',()=>{const result=buildMarketerDirectory(organizations,[{...sites[0]!,deleted_at:'2026-01-01'},{...sites[1]!,is_active:false}],clients,{id:'admin',system_role:'ADMIN',org_type:'REGULATEUR'} as AuthUser);expect(result.every(row=>row.coordinates===null)).toBe(true)})
})
