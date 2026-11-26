import {ROSTER} from '../sim/buildings';
import type { BuildType, CommandAction, Faction, Kind, Point } from '../sim/types';
import { HEIGHT, WIDTH } from '../sim/maps';
import type { SimWorld } from '../sim/world';
import { BUILD_NAMES, type Controls, type Hud } from './hud';
import type { Renderer, Overlay } from './renderer';
export class Input {
    readonly overlay: Overlay;
    private drag: {
        start: Point;
        last: Point;
        right: boolean;
        id: number;
        moved: boolean;
    } | null = null;
    private keys = new Set<string>();
    settingRally=false;
    private timer = 0;
    constructor(private w: SimWorld, private r: Renderer, private hud: Hud, private s: Controls, private send: (a: CommandAction) => void, private act: (id: string) => void) {
        this.overlay = { selected: s.selected, box: null, hover: null, build: null, faction: 0, order: null };
        const canvas = r.canvas, cam = r.camera, position = (e: PointerEvent) => { const rect = canvas.getBoundingClientRect(); return { x: e.clientX - rect.left, y: e.clientY - rect.top }; };
        canvas.oncontextmenu = e => e.preventDefault();
        canvas.onpointerdown = e => { if (e.button !== 0 && e.button !== 2)
            return; e.preventDefault(); const p = position(e); this.drag = { start: p, last: p, right: e.button === 2, id: e.pointerId, moved: false }; canvas.setPointerCapture(e.pointerId); };
        canvas.onpointermove = e => {
            const p = position(e), d = this.drag;
            this.overlay.hover = cam.world(p.x, p.y);
            if (!d || d.id !== e.pointerId)
                return;
            if (Math.hypot(p.x - d.start.x, p.y - d.start.y) > 4)
                d.moved = true;
            if (d.moved) {
                if (d.right) {
                    cam.x -= (p.x - d.last.x) / cam.zoom;
                    cam.y -= (p.y - d.last.y) / cam.zoom;
                    cam.clamp();
                    canvas.style.cursor = 'grabbing';
                }
                else
                    this.overlay.box = { start: d.start, end: p };
            }
            d.last = p;
        };
        canvas.onpointerup = e => {
            const d = this.drag;
            if (!d || d.id !== e.pointerId)
                return;
            const p = position(e), point = cam.world(p.x, p.y);
            if (d.moved && !d.right) {
                const a = cam.world(d.start.x, d.start.y);
                if (!e.shiftKey)
                    s.selected.clear();
                for (const u of w.units)
                    if (!u.tower && u.faction === s.faction && u.x >= Math.min(a.x, point.x) && u.x <= Math.max(a.x, point.x) && u.y >= Math.min(a.y, point.y) && u.y <= Math.max(a.y, point.y))
                        s.selected.add(u.id);
                if (s.selected.size) {
                    s.scope = 'selected';
                    s.mode = 'select';
                    (document.getElementById('scope') as HTMLSelectElement).value = 'selected';
                }
                hud.toast('已框选 ' + s.selected.size + ' 名士兵');
            }
            else if (!d.moved) {
                if(this.settingRally){
                    this.send({type:'rally',payload:{...point,building:s.hall}});this.settingRally=false;this.overlay.order=point;this.timer=2;
                }else if (d.right || s.mode === 'order')
                    this.order(point);
                else if(w.mode==='lord'&&!s.build&&w.structures.some(t=>t.hp>0&&t.faction===0&&Object.values(ROSTER).some(row=>row[1]===t.type)&&Math.abs(t.x-point.x)<=t.w/2&&Math.abs(t.y-point.y)<=t.h/2)){
                    const hall=w.structures.find(t=>t.hp>0&&t.faction===0&&Math.abs(t.x-point.x)<=t.w/2&&Math.abs(t.y-point.y)<=t.h/2)!;hud.selectHall(hall.id);
                }else if (s.mode === 'select'||w.mode==='lord'&&!s.build) {
                    let closest = 28 / cam.zoom;
                    let id = 0;
                    for (const u of w.units) {
                        if (u.faction !== s.faction || u.tower)
                            continue;
                        const dist = Math.hypot(u.x - point.x, u.y - u.z - point.y);
                        if (dist < closest) {
                            closest = dist;
                            id = u.id;
                        }
                    }
                    if (!e.shiftKey)
                        s.selected.clear();
                    if (id) {
                        s.selected.add(id);
                        s.scope = 'selected';
                        (document.getElementById('scope') as HTMLSelectElement).value = 'selected';
                    }
                }
                else if (s.build) {
                    const b = w.blueprint(s.build, point, s.faction);
                    if (b.valid) {
                        this.send({ type: 'build', payload: { ...point, kind: s.build } });
                        hud.toast('已下达建造指令 · ' + BUILD_NAMES[s.build]);
                    }
                    else
                        hud.toast(s.build === 'pontoon' ? '请在空旷的河面中央架桥' : '此处无法建造，请检查地形、重叠或数量上限');
                }
                else {
                    this.send({ type: 'spawn', payload: { ...point, kind: s.kind, count: s.count, formation: s.form } });
                    hud.toast('已部署 ' + s.count + ' 名士兵');
                }
            }
            this.drag = null;
            this.overlay.box = null;
            hud.refresh();
        };
        canvas.onpointercancel = () => { this.drag = null; this.overlay.box = null; };
        canvas.onpointerleave = () => { if (!this.drag)
            this.overlay.hover = null; };
        canvas.addEventListener('wheel', e => { e.preventDefault(); const rect = canvas.getBoundingClientRect(); cam.scale(e.deltaY < 0 ? 1.16 : 1 / 1.16, e.clientX - rect.left, e.clientY - rect.top); }, { passive: false });
        const mini = r.mini, jump = (e: PointerEvent) => { const a = mini.getBoundingClientRect(); cam.x = (e.clientX - a.left) / a.width * WIDTH; cam.y = (e.clientY - a.top) / a.height * HEIGHT; cam.clamp(); };
        mini.onpointerdown = e => { mini.setPointerCapture(e.pointerId); jump(e); };
        mini.onpointermove = e => { if (mini.hasPointerCapture(e.pointerId))
            jump(e); };
        window.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                hud.close();
                this.drag = null;
                this.overlay.box = null;
                return;
            }
            if (hud.modalOpen || e.target instanceof HTMLSelectElement)
                return;
            const k = e.key.toLowerCase();
            if (k === ' ') {
                e.preventDefault();
                if (!e.repeat)
                    this.act('pause');
                return;
            }
            if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
                e.preventDefault();
                this.keys.add(k);
            }
        });
        window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
        window.addEventListener('blur', () => this.keys.clear());
    }
    scope() { const s = this.s; if (s.scope === 'selected')
        return { ids: [...s.selected] }; if (s.scope === 'kind')
        return { kind: s.kind }; return {}; }
    private order(p: Point) {
        const s = this.s;
        const target = this.w.structures.find(t => t.hp > 0 && t.faction !== s.faction && Math.abs(p.x - t.x) < t.w / 2 + 5 && Math.abs(p.y - t.y) < t.h / 2 + 5);
        const site=this.w.structures.find(t=>t.hp>0&&(t.hp<t.maxHp||t.needed)&&(t.faction===s.faction||t.faction===-1&&['bridge','pontoon'].includes(t.type))&&Math.abs(p.x-t.x)<=t.w/2+5&&Math.abs(p.y-t.y)<=t.h/2+5);
        if(site&&[...s.selected].some(id=>['peasant','sapper'].includes(this.w.byUnit.get(id)?.kind??''))){
            this.send({type:'repair',payload:{site:site.id,ids:[...s.selected]}});this.hud.toast('工人已前往建造或维修');return;
        }
        const tower=this.w.structures.find(t=>t.hp>0&&t.faction===s.faction&&['tower','outpost'].includes(t.type)&&Math.abs(p.x-t.x)<t.w/2+5&&Math.abs(p.y-t.y)<t.h/2+5);
        if(tower&&[...s.selected].some(id=>['longbowman','bowman'].includes(this.w.byUnit.get(id)?.kind??''))){
            const seats=tower.type==='outpost'?2:3;
            if(this.w.units.filter(u=>u.tower===tower.id&&u.hp>0).length>=seats)this.hud.toast('箭塔已满员');
            else {this.send({type:'garrison',payload:{tower:tower.id,ids:[...s.selected]}});this.hud.toast('弓手正前往箭塔驻守');}return;
        }
        const filter = s.selected.size ? { ids: [...s.selected] } : this.scope();
        if (filter.ids?.length === 0) {
            this.hud.toast('请先框选待指挥的士兵');
            return;
        }
        if(this.w.mode==='lord'&&(target?.type==='tree'||target?.type==='mine')&&s.selected.size&&[...s.selected].some(id=>this.w.byUnit.get(id)?.kind==='peasant')){
            this.send({type:'gather',payload:{resource:target.type==='tree'?'wood':'gold',ids:[...s.selected],target:target.id}});
            this.hud.toast('农夫已接到采集指令');return;
        }
        this.send({ type: 'order', payload: { ...filter, point: p, structureId: target?.id } });
        this.overlay.order = p;
        this.timer = 2;
        this.hud.toast(target ? '已下达攻击目标指令' : '已下达集结指令');
    }
    update(dt: number) {
        const c = this.r.camera, s = this.s, k = this.keys;
        let x = 0, y = 0;
        if (k.has('a') || k.has('arrowleft'))
            x--;
        if (k.has('d') || k.has('arrowright'))
            x++;
        if (k.has('w') || k.has('arrowup'))
            y--;
        if (k.has('s') || k.has('arrowdown'))
            y++;
        if (x || y) {
            c.x += x * dt * 600 / c.zoom;
            c.y += y * dt * 600 / c.zoom;
            c.clamp();
        }
        this.timer -= dt;
        if (this.timer <= 0)
            this.overlay.order = null;
        this.overlay.build = s.mode === 'spawn' ? s.build : null;
        this.overlay.faction = s.faction;
    }
}
export function selectBrush(s: Controls, k: Kind | BuildType, building: boolean) { s.selected.clear(); s.build = building ? k as BuildType : null; if (!building)
    s.kind = k as Kind; s.mode = 'spawn'; }
export function switchSide(s: Controls, f: Faction) { s.faction = f; s.selected.clear(); }
