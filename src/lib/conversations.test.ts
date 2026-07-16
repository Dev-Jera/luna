import {describe,expect,it} from 'vitest'
import {unreadTotal} from './conversations'
describe('unreadTotal',()=>{it('sums unread messages without counting conversations',()=>{expect(unreadTotal([{unread_count:2},{unread_count:3}] as never)).toBe(5)});it('returns zero for an empty inbox',()=>{expect(unreadTotal([])).toBe(0)})})
