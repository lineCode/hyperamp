var html = require('choo/html')
var fd = require('format-duration')
var classNames = require('classnames')
var Component = require('cache-component')
var HyperList = require('hyperlist')
var document = require('global/document')
var styles = require('./styles')

function TableRows (opts) {
  if (!(this instanceof TableRows)) return new TableRows()
  if (!opts) opts = {}
  this._opts = Object.assign({}, opts)

  // State
  this._emit = null
  this._trackOrder = []
  this._trackDict = {}
  this._currentIndex = null
  this._selectedIndex = null
  this._hyperListContainer = null

  // Bound methods
  this._selectTrack = this._selectTrack.bind(this)
  this._playTrack = this._playTrack.bind(this)
  this._rowMap = this._rowMap.bind(this)
  this._mutateCurrentIndex = this._mutateCurrentIndex.bind(this)
  this._mutateSelectedIndex = this._mutateSelectedIndex.bind(this)

  Component.call(this)
}
TableRows.prototype = Object.create(Component.prototype)

TableRows.prototype._selectTrack = function (ev) {
  var t = ev.target
  while (t && !t.id) t = t.parentNode // Bubble up
  if (t && t.tagName === 'TR') {
    var index = Number(t.id.replace('track-', ''))
    this._emit('library:select', index)
  }
}

TableRows.prototype._playTrack = function (ev) {
  var t = ev.target
  while (t && !t.id) t = t.parentNode // Bubble up
  if (t && t.tagName === 'TR') {
    var index = Number(t.id.replace('track-', ''))
    this._emit('player:queue', index)
    this._emit('player:play')
  }
}

TableRows.prototype._mutateCurrentIndex = function (newIndex) {
  var oldIndex = this._currentIndex
  var oldEl = document.getElementById(`track-${oldIndex}`)
  var newEl = document.getElementById(`track-${newIndex}`)

  if (oldEl) oldEl.classList.toggle(styles.playing, false)
  if (newEl) newEl.classList.toggle(styles.playing, true)

  this._currentIndex = newIndex
}

TableRows.prototype._mutateSelectedIndex = function (newIndex) {
  var oldIndex = this._selectedKey
  var oldEl = document.getElementById(`track-${oldIndex}`)
  var newEl = document.getElementById(`track-${newIndex}`)

  if (oldEl) oldEl.classList.toggle(styles.selected, false)
  if (newEl) newEl.classList.toggle(styles.selected, true)

  this._selectedKey = newIndex
}

TableRows.prototype._rowMap = function (idx) {
  // Look up track info
  var key = this._trackOrder[idx]
  var meta = this._trackDict[key]
  // Generate state based styles
  var classes = {}
  classes[styles.playing] = this._currentIndex === idx
  classes[styles.selected] = this._selectedIndex === idx

  return html`
    <tr id="track-${idx}"
        data-key=${key}
        className="${classNames(classes)}">
      <td>${meta.title}</td>
      <td class="${styles.time}">${meta.duration ? fd(meta.duration * 1000) : ''}</td>
      <td>${meta.artist}</td>
      <td>${meta.album}</td>
    </tr>
  `
}

TableRows.prototype._render = function (state, emit) {
  this._emit = emit
  // Save references to state track order and dicts
  this._trackOrder = state.library.trackOrder
  this._trackDict = state.library.trackDict
  // Save state
  // Current index is the index of a queued track
  this._currentIndex = state.player.currentIndex
  // Selected index is the index of the highlighted track
  this._selectedIndex = state.library.selectedIndex
  // ${this._trackOrder.map(this._rowMap)}
  var self = this
  var container = html`
              <tbody
                ondblclick=${this._playTrack}
                onclick=${this._selectTrack}></tbody>`
  HyperList.create(container, {
    height: 300,
    itemHeight: 20,
    total: self._trackOrder.length,
    generate: self._rowMap
  })

  return container
}

TableRows.prototype._update = function (state, emit) {
  // Re-render
  // Note, these are only shallow compares.  You must slice or reobject your state
  if (this._trackOrder !== state.library.trackOrder) return true
  if (this._trackDict !== state.library.trackDict) return true
  // Mutate
  if (this._currentIndex !== state.player.currentIndex) {
    this._mutateCurrentIndex(state.player.currentIndex)
  }
  if (this._selectedIndex !== state.library.selectedIndex) {
    this._mutateSelectedIndex(state.library.selectedIndex)
  }
  // Cache!
  return false
}

module.exports = TableRows
