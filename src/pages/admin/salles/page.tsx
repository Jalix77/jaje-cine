import React, { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../../components/feature/AdminLayout'
import { supabase } from '../../../lib/supabaseClient'

type RoomStatus = 'ACTIVE' | 'MAINTENANCE' | 'FERME'

type DbRoom = {
  id: string
  name: string
  capacity: number
  rows: number
  seats_per_row: number
  status: RoomStatus | string
}

type PriceZone = {
  zone: string
  rows: string
  price: number
  color: string
}

type UiSalle = {
  id: string
  name: string
  capacity: number
  rows: number
  seatsPerRow: number
  priceZones: PriceZone[]
  status: RoomStatus
}

const AdminSalles: React.FC = () => {
  const [rooms, setRooms] = useState<DbRoom[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [roomsError, setRoomsError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    capacity: 0,
    rows: 10,
    seatsPerRow: 12,
    status: 'ACTIVE' as RoomStatus,
  })

  const defaultPriceZones: PriceZone[] = useMemo(
    () => [
      { zone: 'Premium', rows: 'A-C', price: 350, color: 'bg-yellow-500' },
      { zone: 'Standard', rows: 'D-G', price: 250, color: 'bg-blue-500' },
      { zone: 'Économique', rows: 'H-J', price: 150, color: 'bg-green-500' },
    ],
    []
  )

  const normalizeStatus = (s: string): RoomStatus => {
    if (s === 'ACTIVE' || s === 'MAINTENANCE' || s === 'FERME') return s
    return 'ACTIVE'
  }

  const salles: UiSalle[] = useMemo(() => {
    return (rooms ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      capacity: Number(r.capacity ?? 0),
      rows: Number(r.rows ?? 0),
      seatsPerRow: Number(r.seats_per_row ?? 0),
      status: normalizeStatus(String(r.status ?? 'ACTIVE')),
      priceZones: defaultPriceZones,
    }))
  }, [rooms, defaultPriceZones])

  const loadRooms = async () => {
    try {
      setLoadingRooms(true)
      setRoomsError(null)

      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, capacity, rows, seats_per_row, status')
        .order('name', { ascending: true })

      if (error) throw error
      setRooms((data ?? []) as DbRoom[])
    } catch (e: any) {
      console.error('loadRooms error:', e)
      setRoomsError(e?.message || 'Erreur chargement')
      setRooms([])
    } finally {
      setLoadingRooms(false)
    }
  }

  useEffect(() => {
    loadRooms()
  }, [])

  const handleOpenModal = (salle?: UiSalle) => {
    if (salle) {
      setEditingId(salle.id)
      setFormData({
        name: salle.name,
        capacity: salle.capacity,
        rows: salle.rows,
        seatsPerRow: salle.seatsPerRow,
        status: salle.status,
      })
    } else {
      setEditingId(null)
      setFormData({
        name: '',
        capacity: 0,
        rows: 10,
        seatsPerRow: 12,
        status: 'ACTIVE',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'capacity' || name === 'rows' || name === 'seatsPerRow'
          ? parseInt(value) || 0
          : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const capacity =
      formData.capacity && formData.capacity > 0
        ? formData.capacity
        : formData.rows * formData.seatsPerRow

    const payload = {
      name: formData.name,
      capacity,
      rows: formData.rows,
      seats_per_row: formData.seatsPerRow,
      status: formData.status,
    }

    try {
      setLoadingRooms(true)
      setRoomsError(null)

      if (editingId) {
        const { error } = await supabase
          .from('rooms')
          .update(payload)
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('rooms')
          .insert(payload)
        if (error) throw error
      }

      handleCloseModal()
      await loadRooms()
    } catch (e: any) {
      setRoomsError(e?.message || 'Erreur lors de la sauvegarde')
    } finally {
      setLoadingRooms(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette salle ?')) return
    try {
      setLoadingRooms(true)
      const { error } = await supabase.from('rooms').delete().eq('id', id)
      if (error) throw error
      await loadRooms()
    } catch (e: any) {
      setRoomsError(e?.message || 'Erreur suppression')
    } finally {
      setLoadingRooms(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: RoomStatus) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ status: newStatus })
        .eq('id', id)
      if (error) throw error
      await loadRooms()
    } catch (e: any) {
      setRoomsError(e?.message || 'Erreur changement statut')
    }
  }

  const getStatusBadge = (status: RoomStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm border border-green-600/30">
            Active
          </span>
        )
      case 'MAINTENANCE':
        return (
          <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-sm border border-yellow-600/30">
            Maintenance
          </span>
        )
      case 'FERME':
        return (
          <span className="px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-sm border border-red-600/30">
            Fermée
          </span>
        )
      default:
        return null
    }
  }

  const generateSeatMap = (salle: UiSalle) => {
    const rowsEls = []
    const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWX'

    for (let i = 0; i < salle.rows; i++) {
      const seats = []
      for (let j = 1; j <= salle.seatsPerRow; j++) {
        let zoneColor = 'bg-gray-600'
        if (i < 3) zoneColor = 'bg-yellow-500/30'
        else if (i < 7) zoneColor = 'bg-blue-500/30'
        else zoneColor = 'bg-green-500/30'

        seats.push(
          <div
            key={`${rowLabels[i] ?? i}-${j}`}
            className={`w-6 h-6 ${zoneColor} border border-gray-600 rounded-sm flex items-center justify-center text-xs text-white`}
          >
            {j}
          </div>
        )
      }

      rowsEls.push(
        <div key={i} className="flex items-center space-x-1 mb-1">
          <div className="w-6 text-center text-white text-sm font-bold">
            {rowLabels[i] ?? i + 1}
          </div>
          <div className="flex space-x-1">{seats}</div>
        </div>
      )
    }

    return rowsEls
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Gestion des Salles
            </h1>
            <p className="text-gray-400">
              Configurez vos salles de cinéma et leurs zones de prix
            </p>
            {roomsError && (
              <p className="mt-2 text-red-400 text-sm">Erreur: {roomsError}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadRooms()}
              className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all duration-300 whitespace-nowrap"
              disabled={loadingRooms}
              title="Rafraîchir depuis Supabase"
            >
              <i className="ri-refresh-line mr-2"></i>
              {loadingRooms ? 'Chargement…' : 'Rafraîchir'}
            </button>

            <button
              onClick={() => handleOpenModal()}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 whitespace-nowrap"
            >
              <i className="ri-add-line mr-2"></i>
              Ajouter une salle
            </button>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium">Total salles</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {salles.length}
                </p>
              </div>
              <i className="ri-building-line text-2xl text-blue-400"></i>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium">Salles actives</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {salles.filter((s) => s.status === 'ACTIVE').length}
                </p>
              </div>
              <i className="ri-check-circle-line text-2xl text-green-400"></i>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm font-medium">Capacité totale</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {salles.reduce((acc, s) => acc + (s.capacity || 0), 0)}
                </p>
              </div>
              <i className="ri-group-line text-2xl text-purple-400"></i>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400 text-sm font-medium">En maintenance</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {salles.filter((s) => s.status === 'MAINTENANCE').length}
                </p>
              </div>
              <i className="ri-tools-line text-2xl text-yellow-400"></i>
            </div>
          </div>
        </div>

        {/* Liste des salles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {salles.map((salle) => (
            <div
              key={salle.id}
              className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {salle.name}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Capacité: {salle.capacity} places
                  </p>
                </div>
                <div className="text-right">{getStatusBadge(salle.status)}</div>
              </div>

              {/* Plan de la salle */}
              <div className="mb-6">
                <h4 className="text-white font-medium mb-3">Plan de la salle</h4>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="text-center mb-4">
                    <div className="w-full h-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full mb-2"></div>
                    <p className="text-yellow-400 text-xs">ÉCRAN</p>
                  </div>

                  <div className="flex flex-col items-center space-y-1">
                    {generateSeatMap(salle)}
                  </div>
                </div>
              </div>

              {/* Zones de prix */}
              <div className="mb-6">
                <h4 className="text-white font-medium mb-3">Zones de prix</h4>
                <div className="space-y-2">
                  {salle.priceZones.map((zone, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 ${zone.color} rounded`}></div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {zone.zone}
                          </p>
                          <p className="text-gray-400 text-xs">
                            Rangées {zone.rows}
                          </p>
                        </div>
                      </div>
                      <p className="text-white font-bold">{zone.price} HTG</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleOpenModal(salle)}
                  className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 py-2 px-4 rounded-lg transition-all duration-300 border border-blue-600/30 whitespace-nowrap"
                >
                  <i className="ri-edit-line mr-2"></i>
                  Modifier
                </button>

                {salle.status === 'ACTIVE' ? (
                  <button
                    onClick={() => handleStatusChange(salle.id, 'MAINTENANCE')}
                    className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 py-2 px-4 rounded-lg transition-all duration-300 border border-yellow-600/30 whitespace-nowrap"
                    title="Marquer en maintenance"
                  >
                    <i className="ri-tools-line"></i>
                  </button>
                ) : salle.status === 'MAINTENANCE' ? (
                  <button
                    onClick={() => handleStatusChange(salle.id, 'ACTIVE')}
                    className="bg-green-600/20 hover:bg-green-600/30 text-green-400 py-2 px-4 rounded-lg transition-all duration-300 border border-green-600/30 whitespace-nowrap"
                    title="Réactiver"
                  >
                    <i className="ri-play-line"></i>
                  </button>
                ) : null}

                <button
                  onClick={() => handleDelete(salle.id)}
                  className="bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 px-4 rounded-lg transition-all duration-300 border border-red-600/30 whitespace-nowrap"
                  title="Supprimer"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal d'ajout/modification */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700/50 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingId ? 'Modifier la salle' : 'Ajouter une salle'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nom de la salle
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                      placeholder="Salle 1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Statut
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="FERME">Fermée</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre de rangées
                    </label>
                    <input
                      type="number"
                      name="rows"
                      value={formData.rows}
                      onChange={handleInputChange}
                      required
                      min="1"
                      max="30"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sièges par rangée
                    </label>
                    <input
                      type="number"
                      name="seatsPerRow"
                      value={formData.seatsPerRow}
                      onChange={handleInputChange}
                      required
                      min="1"
                      max="40"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Capacité totale
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={
                        formData.capacity && formData.capacity > 0
                          ? formData.capacity
                          : formData.rows * formData.seatsPerRow
                      }
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700/50">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all duration-300 whitespace-nowrap"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-semibold rounded-xl transition-all duration-300 whitespace-nowrap"
                  >
                    {editingId ? 'Modifier' : 'Ajouter'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminSalles