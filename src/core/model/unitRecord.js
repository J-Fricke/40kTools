// ─── UnitRecord — the data contract (Story A) ───────────────────────────────
// The shape `scripts/bsdata-import/v2/ingest.mjs` emits into
// `src/core/data/<faction>.json`, and the shape Stories B (keyword dictionary
// + engine), C (ability layer), and D (Evaluator wiring) import. Frozen at
// umbrella-plan sync point S2 / this plan's S-A2 — no field renames after
// that without a coordination note in the Work file.
//
// This file is types/documentation only — no runtime code.

/**
 * @typedef {Object} WeaponMode
 * A weapon fires with exactly one mode per phase (P1: verified across all 34
 * catalogues — nothing uses >1 mode at once). Characteristics are the RAW
 * BSData strings — the engine (Story B) does dice-averaging, skill mapping,
 * and keyword interpretation.
 * @property {string}   name           display name (e.g. "Kustom Shoota - Aimed", or same as the weapon)
 * @property {string}   A              Attacks, verbatim ("3", "D6", "D3+1")
 * @property {string}  [BS]            ballistic skill ("3+", "N/A") — ranged modes
 * @property {string}  [WS]            weapon skill — melee modes
 * @property {string}   S              Strength ("6", "User", "2D6")
 * @property {string}   AP             Armour Penetration ("0", "-1")
 * @property {string}   D              Damage, verbatim ("1", "D6+1")
 * @property {string}  [range]         e.g. "24\"" ; absent for melee
 * @property {number}  [qty]           profile-level multiplier ("2 twin bolt cannons")
 * @property {string[]} keywords       canonical keyword strings (lowercased,
 *                                     separators collapsed) — NOT parsed; e.g.
 *                                     ["sustained hits 1", "anti infantry 3+", "lethal hits: non monster/vehicle"]
 */

/**
 * @typedef {Object} Weapon
 * @property {string}       id          stable within the record (slug of name, deduped)
 * @property {string}       name
 * @property {number}      [count]      >1 when the datasheet fields multiples ("2 twin bolt cannons")
 * @property {WeaponMode[]} [ranged]    shooting profiles — pick one when shooting
 * @property {WeaponMode[]} [melee]     fight profiles — pick one when fighting
 * @property {boolean}     [refOnly]    a "(ref. only)" profile for a mixed unit
 */

/**
 * @typedef {Object} WargearNode
 * A faithful BSData selection node. `min`/`max` are the raw `selections`-field
 * constraints; `constraintEval` (Story A / task A4) computes the *effective*
 * limits against a build state.
 * @property {string}         name
 * @property {"group"|"option"|"model"} kind
 * @property {number}         min
 * @property {number}         max          (Infinity serialised as null)
 * @property {number}        [perModels]   "1 per N models"
 * @property {boolean}       [defaultSelected]
 * @property {string[]}      [weaponRefs]  Weapon.id[] this option grants
 * @property {WargearNode[]} [children]
 * @property {Object[]}      [conditions]  kept raw conditional modifiers (for constraintEval)
 * @property {string}        [unresolved]  regression guard — a link/profile that didn't resolve
 * @property {string}        [srcId]       BSData entry id, for debugging
 */

/**
 * @typedef {Object} UnitRecord
 * @property {string}   id           `<factionKey>/<slug(name)>`
 * @property {string}   faction
 * @property {string}   name
 * @property {string[]} keywords     every categoryLink, lowercased, verbatim
 * @property {Object}   stats        raw strings: { M, T, Sv, W, OC, Ld,
 *                                   InvSv:(string|null), FNP:(string|null) }
 * @property {Object}   size         { min, max }  (model count)
 * @property {{models:number,pts:number}[]} points  one per fielded size
 * @property {{name:string,text:string,bracket?:boolean}[]} abilities  untyped (Story C types them)
 * @property {Weapon[]} weapons
 * @property {WargearNode} wargear   root node (kind "group")
 * @property {Object}  [provenance]  { catalogue, entryId }
 * @property {string[]}[overridden]  fields patched by overrides.js
 */

/**
 * @typedef {Object} SyncReport
 * @property {string} generatedAt
 * @property {{key:string,file:string,units:number}[]} catalogues
 * @property {string[]} parseFailures
 * @property {{raw:string,egs:string[]}[]} unresolvedKeywordShapes
 * @property {{unit:string,group:string,rule:number}[]} defaultRuleFallback
 * @property {string[]} noStats
 * @property {string[]} damageBrackets
 * @property {{unit:string,path:string,reason:string}[]} unresolvedNodes
 * @property {{unit:string,fields:string[]}[]} overridesApplied
 */

export {};
