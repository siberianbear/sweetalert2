/* global QUnit */
const {swal, initialSwalPropNames} = require('./helpers')

QUnit.test('properties of `swal` are consistent', (assert) => {
  const done = assert.async()
  const assertConsistent = postfix => {
    const currentSwalPropNames = Object.keys(swal)
    const extraPropNames = currentSwalPropNames.filter(key => !initialSwalPropNames.includes(key))
    assert.deepEqual(extraPropNames.length, 0, `# of extra properties ${postfix}`)
    assert.deepEqual(extraPropNames.join(','), '', `extra property names ${postfix}`)
    const missingProps = currentSwalPropNames.filter(key => !currentSwalPropNames.includes(key))
    assert.deepEqual(missingProps.length, 0, `# of missing properties ${postfix}`)
    assert.deepEqual(missingProps.join(','), '', `missing property names ${postfix}`)
  }
  assertConsistent('before first swal')
  swal({
    title: 'test',
    onOpen: () => {
      assertConsistent('after opening first swal')
      swal.clickConfirm()
    }
  }).then(() => {
    assertConsistent('after closing first swal')
    done()
  })
})

QUnit.test('defaults are applied to undefined arguments in shorthand calls', (assert) => {
  const done = assert.async()
  swal.setDefaults({
    html: 'foo',
    onOpen: () => {
      assert.equal(swal.getTitle().textContent, 'bar')
      assert.equal(swal.getContent().textContent, 'foo')
      swal.resetDefaults()
      done()
    }
  })
  swal('bar')
})

QUnit.test('basic object-type mixin', (assert) => {
  const done = assert.async()
  const mySwal = swal.mixin({
    input: 'text',
    inputValue: 'inputValue'
  })
  assert.deepEqual(Object.entries(mySwal), Object.entries(swal))
  mySwal({ onOpen: () => mySwal.clickConfirm() })
    .then((result) => {
      assert.equal(result.value, 'inputValue')
      done()
    })
})

QUnit.test('basic function-type mixin', (assert) => {
  const originalSwal = swal
  const mySwal = swal.mixin(swal => {
    assert.equal(swal, originalSwal)
    return params => {
      assert.deepEqual(params, { title: 'title' })
      // normally here we would call `swal` and return the result, while working in the mixin's magic
      // but there's really no need to use `swal` here since we know `swal === originalSwal` and it should behave as such
      // whatever we return here should be the return value of `mySwal()`, so lets just return a simple sync value
      return { value: 'value' }
    }
  })
  assert.deepEqual(Object.entries(mySwal), Object.entries(swal))
  const result = mySwal({ title: 'title' })
  assert.deepEqual(result, { value: 'value' })
})

QUnit.test('different mixins of different types applied at once', (assert) => {
  const objectMixin = { title: 'a', html: 'a', footer: 'a' }
  const functionMixin = swal => params => swal(Object.assign({ html: 'b' }, params, { footer: 'b' }))
  const mySwal = swal.mixin(objectMixin, functionMixin)
  mySwal({ html: 'c', footer: 'c' })
  const { params } = mySwal.getCurrentContext()
  assert.equal(params.title, 'a')
  assert.equal(params.html, 'c')
  assert.equal(params.footer, 'b')
})

QUnit.test('object-type mixins and shorthand calls', (assert) => {
  const mySwal = swal.mixin({
    title: 'has no effect',
    html: 'has no effect',
    type: 'error',
    footer: 'footer'
  })
  mySwal('title', 'html', 'info')
  const { params } = mySwal.getCurrentContext()
  assert.equal(params.title, 'title')
  assert.equal(params.html, 'html')
  assert.equal(params.type, 'info')
  assert.equal(params.footer, 'footer')
})

QUnit.test('function-type mixins and shorthand calls', (assert) => {
  const done = assert.async()
  const mySwal = swal.mixin(swal => params => {
    assert.deepEqual(params, { title: 'title', html: 'html', type: 'info' })
    done()
  })
  mySwal('title', 'html', 'info')
})

QUnit.test('function-type mixins with static properties & methods', (assert) => {
  const staticMembers = {
    property: 'property',
    method: () => 'method'
  }
  const mySwal = swal.mixin(swal => [
    params => {},
    staticMembers
  ])
  assert.deepEqual(Object.entries(mySwal), [ ...Object.entries(swal), ...Object.entries(staticMembers) ])
})

QUnit.test('function-type mixin extending argsToParams', (assert) => {
  let argsToParams
  let argsToParamsCalledCount = 0
  const mySwal = swal.mixin(swal => {
    argsToParams = args => {
      argsToParamsCalledCount++
      const [title, html, footer] = args
      return Object.assign({}, swal.argsToParams([title, html]), {footer})
    }
    return [
      options => options,
      { argsToParams }
    ]
  })
  assert.equal(mySwal.argsToParams, argsToParams)
  assert.equal(argsToParamsCalledCount, 0)
  assert.deepEqual(mySwal('title', 'html', 'footer'), { title: 'title', html: 'html', footer: 'footer' })
  assert.equal(argsToParamsCalledCount, 1)
})
