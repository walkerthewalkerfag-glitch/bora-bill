--!nocheck
-- Intro + saves menu controller (mirror of web/ctl.js). Pure logic: the host supplies time, audio and saves.
local PVController = {}
PVController.__index = PVController

local K = { tx = 1, ty = 2, rot = 3, sx = 4, sy = 5, op = 6, vis = 7, tint = 8, gx = 9, gy = 10, bw = 11 }
PVController.K = K
local BONE = { 247, 243, 237 }
local EMPTY = { 207, 199, 189 }
local EASE = { 0.25, 0.1, 0.25, 1 }

local ACCENTS = {
	["á"] = "Á", ["à"] = "À", ["â"] = "Â", ["ã"] = "Ã", ["ä"] = "Ä", ["é"] = "É", ["è"] = "È", ["ê"] = "Ê",
	["í"] = "Í", ["ì"] = "Ì", ["î"] = "Î", ["ó"] = "Ó", ["ò"] = "Ò", ["ô"] = "Ô", ["õ"] = "Õ", ["ö"] = "Ö",
	["ú"] = "Ú", ["ù"] = "Ù", ["û"] = "Û", ["ü"] = "Ü", ["ç"] = "Ç", ["ñ"] = "Ñ",
}
local function upper(s)
	s = string.upper(s)
	return (string.gsub(s, "[\195][\128-\191]", function(c)
		return ACCENTS[c] or c
	end))
end
PVController.upper = upper

local function startsWith(s, p)
	return string.sub(s, 1, #p) == p
end

function PVController.new(core, host)
	local self = setmetatable({}, PVController)
	self.core = core
	self.host = host
	self.ui = core.scene.ui
	self.SP = self.ui.sp
	self.TW = self.ui.tw
	self.s = {
		phase = "gate", go = false, sel = 1, saves = { false, false, false }, modal = "", closing = "",
		muted = false, music = 70, sfx = 85, shake = true, skipIntro = false,
	}
	self.hits = {}
	for i, n in ipairs(core.nodes) do
		if n.k == "h" then
			table.insert(self.hits, i)
		end
	end
	table.sort(self.hits, function(a, b)
		return core.rank[a] > core.rank[b]
	end)
	self.pointer = nil
	self.hover = ""
	self.pressed = ""
	self.drag = ""
	self.timers = {}
	self.ctaLab = ""
	self.toastOn = false
	self.toastUntil = 0
	self.finished = false
	self.now = 0
	self.binds = {}
	return self
end

-- ---------------------------------------------------------------- helpers
function PVController:n(id)
	return self.core:id(id)
end
function PVController:sp(id, k, to, name)
	self.core:spring(self:n(id), K[k], to, self.SP[name], self.now)
end
function PVController:spS(id, to, name)
	local i = self:n(id)
	local d = self.core.dyn[i]
	local cur = (d and d[4]) and d[4].to or 1
	local nm = name
	if not nm then
		if to < cur - 1e-9 then
			nm = "press"
		elseif to > cur + 1e-9 then
			nm = "release"
		else
			nm = (d and d[4] and d[4].nm) or "release"
		end
	end
	self.core:spring(i, 4, to, self.SP[nm], self.now)
	self.core:spring(i, 5, to, self.SP[nm], self.now)
	if self.core.dyn[i][4] then
		self.core.dyn[i][4].nm = nm
	end
end
function PVController:snap(id, k, v)
	self.core:snap(self:n(id), K[k], v, self.now)
end
function PVController:tw(id, k, to, name, delay, from)
	local spec = type(name) == "table" and name or self.TW[name]
	self.core:tween(self:n(id), K[k], to, spec, self.now, delay, from)
end
function PVController:set(id, k, v)
	self.core:set(self:n(id), K[k], v)
end
function PVController:kfs(id, k, vals, name)
	local spec = type(name) == "table" and name or self.TW[name]
	self.core:addKfs(self:n(id), K[k], vals, spec, self.now)
end
function PVController:later(dt, fn)
	table.insert(self.timers, { t = self.now + dt, fn = fn })
end
function PVController:introT()
	local c = self.core.clocks.intro
	return c == nil and -1 or self.now - c
end
function PVController:cutT()
	local c = self.core.clocks.cut
	return c == nil and -1 or self.now - c
end
function PVController:ready()
	local s = self.s
	return s.phase == "intro" and not s.go and s.modal == "" and self:introT() >= 9.3
end
function PVController:has(i)
	return self.s.saves[i] ~= false and self.s.saves[i] ~= nil
end

-- ---------------------------------------------------------------- input
function PVController:hitAt(x, y)
	local core = self.core
	for _, i in ipairs(self.hits) do
		local w = core.world[i]
		if w.vis then
			local n = core.nodes[i]
			local m = w.m
			local x1, x2, x3, x4 = m[5], m[1] * n.w + m[5], m[3] * n.h + m[5], m[1] * n.w + m[3] * n.h + m[5]
			local y1, y2, y3, y4 = m[6], m[2] * n.w + m[6], m[4] * n.h + m[6], m[2] * n.w + m[4] * n.h + m[6]
			if x >= math.min(x1, x2, x3, x4) and x <= math.max(x1, x2, x3, x4) and y >= math.min(y1, y2, y3, y4) and y <= math.max(y1, y2, y3, y4) then
				if self:enabled(n.on) then
					return n
				end
				return nil
			end
		end
	end
	return nil
end

function PVController:enabled(on)
	local s = self.s
	if on == "start" then
		return s.phase == "gate"
	end
	if s.phase ~= "intro" then
		return false
	end
	if on == "skip" or on == "replay" or on == "sound" then
		return true
	end
	if on == "scrim" then
		return s.modal ~= ""
	end
	if on == "dlgCancel" or on == "dlgDelete" then
		return s.modal == "del"
	end
	if on == "dlgDone" or startsWith(on, "slider_") or startsWith(on, "toggle_") then
		return s.modal == "cfg"
	end
	return not s.go and s.modal == "" and self:introT() >= 9.3
end

function PVController:pointerMove(x, y)
	self.pointer = { x, y }
	if self.drag ~= "" then
		self:dragTo(x)
	end
end
function PVController:pointerLeave()
	self.pointer = nil
end
function PVController:pointerDown(x, y)
	self.pointer = { x, y }
	local h = self:hitAt(x, y)
	self.pressed = h and h.on or ""
	self.hover = self.pressed
	if h and h.drag then
		self.drag = h.on
		self:dragTo(x)
		self.host:sfx("tick")
	end
end
function PVController:pointerUp(x, y, touch)
	local h = self:hitAt(x, y)
	local was, dragging = self.pressed, self.drag
	self.pressed = ""
	self.drag = ""
	if touch then
		self.pointer = nil
	end
	if dragging ~= "" then
		return
	end
	if h and h.on == was then
		self:click(was)
	end
end
function PVController:updateHover()
	local h = self.pointer and self:hitAt(self.pointer[1], self.pointer[2]) or nil
	local on = h and h.on or ""
	if on ~= self.hover then
		self.hover = on
		if on ~= "" then
			self:hoverEnter(on)
		end
	end
	return on
end
function PVController:hoverEnter(on)
	local s = self.s
	if on == "start" or on == "scrim" then
		return
	end
	if on == "save" then
		self:kfs("b2a_ic", "ty", { 0, -3.5, 0 }, "bob")
	elseif on == "delete" and self:has(s.sel) then
		self:kfs("b2b_ic", "rot", { 0, -16, 9, 0 }, "wiggle")
	elseif on == "nuzlocke" then
		self:kfs("b3a_ic", "rot", { 0, -12, 9, -4, 0 }, "wiggle")
		self:kfs("b3a_soon", "rot", { 0, 5, -3, 0 }, "wiggle")
	elseif on == "play" then
		self:kfs("cta_ic_" .. self.ctaLab, "tx", { 0, 5, 0 }, "bob")
	end
	self.host:sfx("tick")
end
function PVController:cursor()
	return self.hover ~= "" and self.hover ~= "scrim"
end

function PVController:click(on)
	local s = self.s
	if not self:enabled(on) then
		return
	end
	if on == "start" then
		self:start()
	elseif on == "skip" then
		self:begin(self.ui.skipAt)
	elseif on == "replay" then
		self:begin(0)
	elseif on == "sound" then
		s.muted = not s.muted
		self.host:volumes(s)
		self.host:store(s)
	elseif startsWith(on, "slot") then
		self:pick(tonumber(string.sub(on, 5)))
	elseif on == "play" then
		self:play()
	elseif on == "save" then
		self:save()
	elseif on == "delete" then
		self:askDelete()
	elseif on == "nuzlocke" then
		self:nuzlocke()
	elseif on == "settings" then
		self:openDlg("cfg")
	elseif on == "scrim" or on == "dlgCancel" or on == "dlgDone" then
		self:closeDlg()
	elseif on == "dlgDelete" then
		self:confirmDelete()
	elseif on == "toggle_shake" then
		s.shake = not s.shake
		self:toggled("shake")
	elseif on == "toggle_skip" then
		s.skipIntro = not s.skipIntro
		self:toggled("skip")
	end
end

-- ---------------------------------------------------------------- flow
function PVController:start()
	self.host:unlock()
	self:begin(self.s.skipIntro and self.ui.skipAt or 0)
end
function PVController:begin(off)
	local s, core = self.s, self.core
	s.phase = "intro"
	s.go = false
	s.modal = ""
	s.closing = ""
	core.phase = "intro"
	core:clearDyn()
	self.timers = {}
	self.toastOn = false
	self.finished = false
	core.clocks.intro = self.now - off
	core.clocks.cut = nil
	core.skipTags.shake = not s.shake
	self.ctaLab = self:has(s.sel) and "c" or "n"
	self:snapCta()
	self.host:playIntro(off)
end
function PVController:snapCta()
	for _, L in ipairs({ "c", "n" }) do
		local on = (L == self.ctaLab) and 1 or 0
		self:snap("cta_ic_" .. L, "op", on)
		self:snap("cta_tx_" .. L, "op", on)
		self:snap("cta_ic_" .. L, "ty", 0)
		self:snap("cta_tx_" .. L, "ty", 0)
	end
end
function PVController:pick(i)
	if not self:ready() then
		return
	end
	local s = self.s
	if s.sel ~= i then
		s.sel = i
		self:snap("scheck" .. i, "sx", 0.6)
		self:snap("scheck" .. i, "sy", 0.6)
	end
	self:tw("cflash" .. i, "gx", 1, "save", 0, -1)
	self:kfs("cflash" .. i, "op", { 0, 0.55, 0 }, "save")
	self.host:sfx("select")
	self.host:store(s)
end
function PVController:play()
	if not self:ready() then
		return
	end
	local s = self.s
	s.go = true
	self.core.clocks.cut = self.now
	local L = self.ctaLab
	local q = { 0.14, EASE }
	self:tw("cta_gold", "op", 1, q)
	self:tw("cta_icg_" .. L, "op", 1, q)
	self:tw("cta_txg_" .. L, "op", 1, q)
	self:tw("cta_ic_" .. L, "op", 0, q)
	self:tw("cta_tx_" .. L, "op", 0, q)
	self:kfs("cta", "sx", { 0, 0.035, 0 }, "ctaHit")
	self:kfs("cta", "sy", { 0, 0.035, 0 }, "ctaHit")
	-- the world holds its breath so the frozen halves match it exactly when they take over
	local settle = { 0.5, { 0.65, 0, 0.25, 1 } }
	self:tw("pvf", "ty", 0, settle)
	for _, a in ipairs({ "aura1", "aura2", "aura3" }) do
		self:tw(a, "op", 0.55, settle)
		self:tw(a, "sx", 1, settle)
		self:tw(a, "sy", 1, settle)
	end
	self:tw("wemb", "op", 0, settle)
	local cur = s.saves[s.sel]
	self.binds.endName = upper("Save 0" .. s.sel .. " · " .. (cur and cur.name or "Novo jogo"))
	self.host:playCut()
end
function PVController:save()
	if not self:ready() then
		return
	end
	local s = self.s
	local i = s.sel
	local had = self:has(i)
	s.saves[i] = self.host:newSave(i)
	self:tw("cflash" .. i, "gx", 1, "save", 0, -1)
	self:kfs("cflash" .. i, "op", { 0, 1, 1, 0 }, "save")
	self:snap("scheck" .. i, "sx", 0.5)
	self:snap("scheck" .. i, "sy", 0.5)
	if not had then
		self:tw("sct" .. i, "op", 1, "delIn", 0, 0)
		self:tw("sct" .. i, "ty", 0, "delIn", 0, 7)
	end
	self:flash("b2a")
	self:toast(had and ("SAVE 0" .. i .. " ATUALIZADO") or ("SALVO NO SLOT 0" .. i))
	self.host:sfx("save")
	self.host:store(s)
end
function PVController:askDelete()
	if not self:ready() then
		return
	end
	local s = self.s
	if not self:has(s.sel) then
		self:kfs("b2b_g", "tx", { 0, -7, 6, -4, 2, 0 }, "deny")
		self:toast("ESTE SLOT JÁ ESTÁ VAZIO")
		self.host:sfx("deny")
		return
	end
	self:flash("b2b")
	self.binds.delTitle = "EXCLUIR SAVE 0" .. s.sel .. "?"
	self:openDlg("del")
end
function PVController:confirmDelete()
	local s = self.s
	if s.modal ~= "del" then
		return
	end
	local i = s.sel
	self:flash("dd_ok")
	self:closeDlg(true)
	self.host:sfx("delete")
	self:tw("sslash" .. i, "gx", 0.55, "slash", 0, -0.55)
	self:kfs("sslash" .. i, "op", { 0, 1, 1, 0 }, { 0.62, EASE })
	self:tw("sct" .. i, "op", 0, "delFade", 0.14)
	self:tw("sct" .. i, "ty", 10, "delFade", 0.14)
	self:tw("sct" .. i, "sx", 0.97, "delFade", 0.14)
	self:tw("sct" .. i, "sy", 0.97, "delFade", 0.14)
	self:later(0.6, function()
		s.saves[i] = false
		self:tw("sct" .. i, "op", 1, "delIn", 0, 0)
		self:tw("sct" .. i, "ty", 0, "delIn", 0, -6)
		self:tw("sct" .. i, "sx", 1, "delIn", 0, 1)
		self:tw("sct" .. i, "sy", 1, "delIn", 0, 1)
		self:toast("SAVE 0" .. i .. " EXCLUÍDO")
		self.host:remove(i)
		self.host:store(s)
	end)
end
function PVController:nuzlocke()
	if not self:ready() then
		return
	end
	self:kfs("b3a_g", "tx", { 0, -7, 6, -4, 2, 0 }, "deny")
	self:kfs("b3a_soon", "rot", { 0, 7, -5, 3, 0 }, "deny")
	self:toast("MODO NUZLOCKE CHEGA EM BREVE")
	self.host:sfx("deny")
end
function PVController:flash(b)
	self:kfs(b .. "_fl", "op", { 0.55, 0 }, "flash")
end

function PVController:openDlg(kind)
	local s = self.s
	if kind == "cfg" then
		self:flash("b3b")
	end
	s.modal = kind
	s.closing = ""
	local d = kind == "del" and "dlg_del" or "dlg_cfg"
	local pre = kind == "del" and "dd_c" or "dc_c"
	self:set("scrim", "vis", 1)
	self:set(d, "vis", 1)
	self:tw("scrim", "op", 1, "scrimIn")
	self:tw(d, "op", 1, { 0.2, EASE }, 0, 0)
	self:snap(d, "sx", 0.94)
	self:snap(d, "sy", 0.94)
	self:snap(d, "ty", 18)
	self:sp(d, "sx", 1, "dlg")
	self:sp(d, "sy", 1, "dlg")
	self:sp(d, "ty", 0, "dlg")
	for j, dl in ipairs(self.ui.dlgStagger) do
		self:tw(pre .. j, "op", 1, "stagger", dl, 0)
		self:tw(pre .. j, "ty", 0, "stagger", dl, 12)
	end
	self.host:sfx("open")
end
function PVController:closeDlg(silent)
	local s = self.s
	if s.modal == "" then
		return
	end
	local kind = s.modal
	local d = kind == "del" and "dlg_del" or "dlg_cfg"
	s.modal = ""
	s.closing = kind
	self:tw(d, "op", 0, "dlgOut")
	self:tw(d, "sx", 0.97, "dlgOut")
	self:tw(d, "sy", 0.97, "dlgOut")
	self:tw(d, "ty", 8, "dlgOut")
	self:tw("scrim", "op", 0, "scrimOut")
	self:later(0.24, function()
		if s.modal ~= "" then
			return
		end
		self:set("scrim", "vis", 0)
		self:set(d, "vis", 0)
		s.closing = ""
	end)
	if not silent then
		self.host:sfx("close")
	end
	self.host:store(s)
end
function PVController:toggled(which)
	local s = self.s
	self:kfs("dc_tgk_" .. which, "sx", { 0, 0.35, 0 }, "squash")
	if which == "shake" then
		self.core.skipTags.shake = not s.shake
	end
	self.host:sfx("toggle")
	self.host:store(s)
end
function PVController:dragTo(x)
	local s = self.s
	local which = string.sub(self.drag, 8)
	local v = math.clamp(math.floor((x - (390 + 222)) / 190 * 100 + 0.5), 0, 100)
	if s[which] ~= v then
		if math.floor(v / 10) ~= math.floor(s[which] / 10) then
			self.host:sfx("tick")
		end
		s[which] = v
		self.host:volumes(s)
	end
end
function PVController:toast(text)
	local W = (self.core.scene.toastW[text] or 200) + self.ui.toastPad
	local was = self.toastOn
	self.toastOn = true
	self.toastUntil = self.now + self.ui.toastLife
	self.binds.toast = text
	self:set("toast", "vis", 1)
	if not was then
		self:snap("toast_m", "sx", (W - 20) / 100)
		self:snap("toast_l", "tx", -W / 2)
		self:snap("toast_r", "tx", W / 2)
		self:tw("toast", "op", 1, "toastIn", 0, 0)
		self:snap("toast", "ty", 14)
		self:sp("toast", "ty", 0, "toast")
	else
		self:sp("toast_m", "sx", (W - 20) / 100, "toast")
		self:sp("toast_l", "tx", -W / 2, "toast")
		self:sp("toast_r", "tx", W / 2, "toast")
		self:tw("toast", "op", 1, "toastIn")
		self:sp("toast", "ty", 0, "toast")
		self:snap("toast", "sx", 0.94)
		self:snap("toast", "sy", 0.94)
	end
	self:sp("toast", "sx", 1, "toast")
	self:sp("toast", "sy", 1, "toast")
	self:tw("toast_tx", "op", 1, { 0.18, EASE }, 0, 0)
end

-- ---------------------------------------------------------------- per frame
function PVController:update(now)
	self.now = now
	local s, core = self.s, self.core
	for _ = 1, 16 do
		if #self.timers == 0 then
			break
		end
		local due, keep = {}, {}
		for _, t in ipairs(self.timers) do
			table.insert(t.t <= now and due or keep, t)
		end
		if #due == 0 then
			break
		end
		self.timers = keep
		for _, t in ipairs(due) do
			t.fn()
		end
	end
	if self.toastOn and now >= self.toastUntil then
		self.toastOn = false
		self:tw("toast", "op", 0, "toastOut")
		self:sp("toast", "ty", -5, "toast")
	end
	if s.phase == "intro" and s.go and not self.finished and self:cutT() >= self.ui.endAt + 1.2 then
		self.finished = true
		self.host:finished(s.sel, s.saves[s.sel])
	end
	local hv, pr = self:updateHover(), self.pressed
	local rdy, has = self:ready(), self:has(s.sel)
	local lab = has and "c" or "n"
	if s.phase == "intro" and not s.go and lab ~= self.ctaLab then
		local old = self.ctaLab
		self.ctaLab = lab
		for _, p in ipairs({ "cta_ic_", "cta_tx_" }) do
			self:sp(p .. old, "op", 0, "fade")
			self:sp(p .. old, "ty", -8, "label")
			self:snap(p .. lab, "ty", 8)
			self:sp(p .. lab, "ty", 0, "label")
			self:sp(p .. lab, "op", 1, "fade")
		end
	end
	for c = 1, 3 do
		local on = "slot" .. c
		local sel = s.sel == c
		local hov = rdy and hv == on
		local down = hov and pr == on
		self:sp("sb" .. c, "tx", hov and 8 or 0, "hover")
		self:spS("sb" .. c, down and 0.975 or 1)
		self:sp("cfill" .. c, "op", sel and 1 or (hov and 0.45 or 0), "fill")
		self:sp("cfill" .. c, "gx", (sel or hov) and 0.55 or -0.55, "fill")
		self:sp("cedgeg" .. c, "op", sel and 1 or 0, "fade")
		self:sp("sng" .. c, "op", sel and 1 or 0, "fade")
		self:sp("snr" .. c, "op", sel and 0 or 1, "fade")
		self:sp("smetaOn" .. c, "op", sel and 1 or 0, "fade")
		self:sp("smeta" .. c, "op", sel and 0 or 1, "fade")
		self:sp("scheck" .. c, "op", sel and 1 or 0, "fade")
		self:spS("scheck" .. c, sel and 1 or 0.6, "check")
		local sv = s.saves[c]
		self.binds["name" .. c] = sv and upper(sv.name) or "VAZIO"
		self.binds["meta" .. c] = sv and sv.meta or "Nenhum progresso salvo"
		self.binds["nameCol" .. c] = sv and BONE or EMPTY
	end
	if not s.go then
		local hov = rdy and hv == "play"
		local down = hov and pr == "play"
		self:sp("cta_hv", "op", hov and 0.12 or 0, "fast")
		self:spS("cb", down and 0.97 or 1)
	else
		self:sp("cta_hv", "op", 0, "fast")
		self:spS("cb", 1)
	end
	for _, B in ipairs({ { "b2a", "save", true }, { "b2b", "delete", has }, { "b3a", "nuzlocke", false }, { "b3b", "settings", true } }) do
		local b, on, en = B[1], B[2], B[3]
		local hov = rdy and hv == on
		local down = hov and pr == on
		self:sp(b .. "_hv", "op", (hov and en) and 1 or 0, "fast")
		self:sp(b .. "_ct", "tx", (hov and en) and 3 or 0, "hover")
		self:sp(b .. "_ct", "op", en and 1 or 0.42, "fade")
		self:sp(b .. "_ic", "op", en and 1 or 0.6, "fade")
		self:spS(b .. "_g", down and 0.955 or 1)
	end
	self:sp("b3b_ic", "rot", (rdy and hv == "settings") and 90 or 0, "spin")
	local tip = rdy and hv == "nuzlocke"
	self:sp("tip", "op", tip and 1 or 0, "fast")
	self:sp("tip", "ty", tip and 0 or -4, "hover")
	for _, B in ipairs({ { "dd_cancel", "dlgCancel" }, { "dd_ok", "dlgDelete" }, { "dc_done", "dlgDone" } }) do
		local b, on = B[1], B[2]
		local hov = hv == on and self:enabled(on)
		local down = hov and pr == on
		self:sp(b .. "_fl", "op", hov and 0.1 or 0, "fast")
		self:spS(b, down and 0.95 or 1)
	end
	for _, w in ipairs({ "music", "sfx" }) do
		local v = s[w] / 100
		local on = "slider_" .. w
		local act = self.drag == on
		local hov = hv == on and self:enabled(on)
		self:sp("dc_fil_" .. w, "sx", v, "knob")
		self:sp("dc_knb_" .. w, "tx", 190 * v, "knob")
		self:spS("dc_knb_" .. w, act and 1.35 or (hov and 1.15 or 1), "hover")
		self.binds["val_" .. w] = tostring(s[w])
	end
	for _, T in ipairs({ { "shake", s.shake }, { "skip", s.skipIntro } }) do
		self:sp("dc_tgr_" .. T[1], "op", T[2] and 1 or 0, "fade")
		self:sp("dc_tgk_" .. T[1], "tx", T[2] and 26 or 0, "toggle")
	end
	for _, B in ipairs({ { "skip", "skip" }, { "again", "replay" } }) do
		local b, on = B[1], B[2]
		local hov = hv == on
		local down = hov and pr == on
		self:sp(b .. "_tx", "op", hov and 1 or 0.62, "fast")
		self:sp(b .. "_ic", "op", hov and 1 or 0.62, "fast")
		self:spS(b, down and 0.94 or 1)
	end
	local sh = hv == "sound"
	self:sp("snd_on", "op", s.muted and 0 or (sh and 1 or 0.62), "fast")
	self:sp("snd_off", "op", s.muted and (sh and 1 or 0.62) or 0, "fast")
	self:spS("snd", (sh and pr == "sound") and 0.9 or 1)
	self.binds.soundLabel = s.muted and "Ativar som" or "Silenciar"
	core.phase = s.phase
end

return PVController
