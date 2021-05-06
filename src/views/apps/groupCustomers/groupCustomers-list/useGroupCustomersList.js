import { ref, watch, computed } from '@vue/composition-api'
import store from '@/store'
import { title } from '@core/utils/filter'

// Notification
import { useToast } from 'vue-toastification/composition'
import ToastificationContent from '@core/components/toastification/ToastificationContent.vue'

export default function useShopsList() {
  // Use toast
  const toast = useToast();

  const refShopListTable = ref(null)

  // Table Handlers
  const tableColumns = [
    { key: 'selected', label: 'All', class: 'all'},
    { key: 'stt', label: 'STT', sortable: false },
    { key: 'title', label: 'Title', formatter: title, sortable: true },
    { key: 'status', label: 'STATUS', sortable: true },
    { key: 'note', label: 'NOTE', sortable: true },
    { key: 'star', label: 'Star', sortable: true },
    { key: 'actions' },
  ]
  const perPage = ref(10)
  const totalShops = ref(0)
  const currentPage = ref(1)
  const perPageOptions = [10, 25, 50, 100]
  const searchQuery = ref(null)
  const sortBy = ref('id')
  const isSortDirDesc = ref(true)
  const status = ref(null)
  const region = ref(null)
  const Shops = ref([])

  const dataMeta = computed(() => {
    const localItemsCount = refShopListTable.value ? refShopListTable.value.localItems.length : 0
    return {
      from: perPage.value * (currentPage.value - 1) + (localItemsCount ? 1 : 0),
      to: perPage.value * (currentPage.value - 1) + localItemsCount,
      of: totalShops.value,
    }
  })

  const refetchData = () => {
    fetchGC()
  }

  watch([currentPage, perPage, searchQuery, status, region], () => {
    refetchData()
  })

  const time = ref(null);
  const isBusy = ref(null);
  const fetchGC = (ctx, callback) => {
    isBusy.value = true;
    if (time.value) {
      clearTimeout(time.value)
    }
    time.value = setTimeout(() => {
      store
          .dispatch('app-groups-customers/fetchGC', {
            q: searchQuery.value,
            perPage: perPage.value,
            page: currentPage.value,
            status: status.value,
            region: region.value,
          })
          .then(response => {
            const { data, totalRecords } = response.data
            totalShops.value = totalRecords
            Shops.value = data
            isBusy.value = false
          })
          .catch(() => {
            toast({
              component: ToastificationContent,
              props: {
                title: 'Error fetching users list',
                icon: 'AlertTriangleIcon',
                variant: 'danger',
              },
            })
          })
    }, searchQuery.value ? 1000 : 0)
  }

  const alert = (variant, message) => {
    toast({
      component: ToastificationContent,
      props: {
        title: "Notification",
        icon: "BellIcon",
        text: "👋 " + message,
        variant,
      },
    });
  }

  const deleteShop = (_id) => {
    return store
      .dispatch('app-groups-customers/deleteShop', { _id: _id })
      .then(response => {
        if (response.data.success) {
          alert("success", "Delete user successfully.")
          fetchGC()
          return true
        } else {
          alert("danger", "Delete user failed.")
        }
      })
      .catch(() => {
        toast({
          component: ToastificationContent,
          props: {
            title: 'Error fetching users list',
            icon: 'AlertTriangleIcon',
            variant: 'danger',
          },
        })
      })
  }

  fetchGC()

  const resolveUserStatusVariant = status => {
    if (status === 0) return 'danger'
    if (status === 1) return 'info'
    return 'danger'
  }

  const checkRegion = (key) => {
    switch (key) {
      case 0:
        return "TP.Ha Noi";
        break;
      case 1:
        return "TP.Ho Chi Minh";
        break;
      default:
        return "TP.Ha Noi";
        break;
    }
  }

  const checkStatus = stt => {
    if (stt === 0) return 'Inactive'
    if (stt === 1) return 'Active'
    return 'Inactive'
  }

  const selected = ref([])
  const one = ref(false)
  const all = ref(false)

  const chooseOne = (item) => {
    one.value = !one.value;
    if (selected.value.indexOf(item) != -1) {
      selected.value = selected.value.filter(val => val != item)
    } else {
      selected.value.push(item)
    }
  }

  const chooseAll = () => {
    all.value = !all.value
    Shops.value.map(obj => {
      chooseOne(obj._id)
    })
  }

  const deleteSoftManyShop = () => {
    store
        .dispatch('app-groups-customers/deleteSoftManyShop', {shopIdArray: selected.value})
        .then(response => {
          if (response.data.success) {
            alert("success", "Delete shops successfully.")
            selected.value = []
            all.value = !all.value
            fetchGC()
          } else {
            alert("danger", "Delete shops failed.")
          }
        })
        .catch(() => {
          toast({
            component: ToastificationContent,
            props: {
              title: 'Error fetching shops list',
              icon: 'AlertTriangleIcon',
              variant: 'danger',
            },
          })
        })
  }

  return {
    one,
    all,
    selected,
    chooseOne,
    chooseAll,
    fetchGC,
    deleteShop,
    checkRegion,
    checkStatus,
    Shops,
    tableColumns,
    perPage,
    currentPage,
    totalShops,
    dataMeta,
    perPageOptions,
    searchQuery,
    sortBy,
    isSortDirDesc,
    refShopListTable,
    deleteSoftManyShop,
    resolveUserStatusVariant,
    refetchData,

    // Extra Filters
    time,
    isBusy,
    status,
    region,
    alert,
  }
}