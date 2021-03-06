<script>
  import { onMount } from 'svelte'
  import { navigateTo } from 'svelte-router-spa'
  import axios from '../../axios-global'
  import Icon from 'svelte-awesome'
  import { refresh, times } from 'svelte-awesome/icons'
  import { user } from '../../stores.js'

  let lunchWeekList = []
  let loading = true
  let showDeleteModal = false
  let showCreateModal = false
  let createWeekOfDate = null
  let weekToDelete = {}

  onMount(async () => {
    try {
      const response = await axios.get(`${process.env.API_ROOT}/api/lunch-week`)
      lunchWeekList = response.data
      loading = false
    } catch (e) {
      console.error(e)
    }
  })

  const openCreateModal = () => {
    showCreateModal = true
  }

  const createLunchWeek = async () => {
    showCreateModal = false
    let newLunchWeek = {
      weekOf: createWeekOfDate,
      isPublished: false,
    }
    try {
      loading = true
      const response = await axios.post(`${process.env.API_ROOT}/api/lunch-week`, newLunchWeek)
      const lunchWeekId = response.data.lunchWeekId
      newLunchWeek.lunchWeekId = lunchWeekId
      lunchWeekList.push(newLunchWeek)
      loading = false
    } catch (e) {
      loading = false
      console.error(e)
    }
  }

  const openLunchWeekDetails = lunchWeek => {
    const route = `/admin/manage-menus/week-details/${lunchWeek.lunchWeekId}`
    navigateTo(route)
  }

  const openDeleteModal = lunchWeek => {
    weekToDelete = lunchWeek
    showDeleteModal = true
  }

  const deleteLunchWeek = async lunchWeek => {
    showDeleteModal = false
    const lunchWeekId = lunchWeek.lunchWeekId
    try {
      loading = true
      await axios.delete(`${process.env.API_ROOT}/api/lunch-week/${lunchWeekId}`)
      const deletedIndex = lunchWeekList.findIndex(x => x.lunchWeekId === lunchWeekId)
      lunchWeekList.splice(deletedIndex, 1)
      loading = false
    } catch (e) {
      loading = false
      console.error(e)
    }
  }
</script>

<style>
  .clickable {
    cursor: pointer;
  }
</style>

<div>
  <nav class="breadcrumb" aria-label="breadcrumbs">
    <ul>
      <li>
        <a href="/">Home</a>
      </li>
      <li>
        <a href="/admin/manage-menus">Lunch Menu Administration</a>
      </li>
      <li class="is-active">
        <a href="/#">{$user.schoolName}</a>
      </li>
    </ul>
  </nav>
  {#if loading}
    <div class="section">
      <Icon spin data="{refresh}" scale="3" />
    </div>
  {:else}
    <button class="button is-text is-small mb-1" on:click="{() => openCreateModal()}">Add Lunch Week</button>
    <table class="table">
      <thead>
        <tr>
          <th>Week Of</th>
          <th>Published</th>
          <th></th>
        </tr>
      </thead>
      {#each lunchWeekList as lunchWeek}
        <tr>
          <td class="has-text-link clickable" on:click="{() => openLunchWeekDetails(lunchWeek)}">{lunchWeek.weekOf}</td>
          <td>{lunchWeek.isPublished}</td>
          <td class="has-text-grey-light clickable" on:click="{() => openDeleteModal(lunchWeek)}">
            <Icon style="margin-top: 4px;" data="{times}" />
          </td>
        </tr>
      {/each}
    </table>
  {/if}
</div>

<div class="{showDeleteModal ? 'modal is-active' : 'modal'}">
  <div class="modal-background"></div>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Warning</p>
      <button class="delete" on:click="{() => (showDeleteModal = false)}" aria-label="close"></button>
    </header>
    <section class="modal-card-body">Delete Week of {weekToDelete.weekOf}?</section>
    <footer class="modal-card-foot">
      <button class="button is-success" on:click="{deleteLunchWeek(weekToDelete)}">Continue</button>
      <button class="button" on:click="{() => (showDeleteModal = false)}">Cancel</button>
    </footer>
  </div>
</div>

<div class="{showCreateModal ? 'modal is-active' : 'modal'}">
  <div class="modal-background"></div>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Create Lunch Week</p>
      <button class="delete" on:click="{() => (showCreateModal = false)}" aria-label="close"></button>
    </header>
    <section class="modal-card-body">
      <div class="field">
        <label for="createWeekOfDate" class="label">Week Of</label>
        <div class="control">
          <input bind:value="{createWeekOfDate}" type="date" class="input" placeholder="yyyy-mm-dd" />
        </div>
      </div>
    </section>
    <footer class="modal-card-foot">
      <button class="button is-success" on:click="{() => createLunchWeek()}">Continue</button>
      <button class="button" on:click="{() => (showCreateModal = false)}">Cancel</button>
    </footer>
  </div>
</div>
