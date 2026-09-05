package network

import "github.com/denisbrodbeck/machineid"

func GetMachineId() string {
	id, err := machineid.ID()
	if err != nil {
		return "guigui_unique_machine_id"
	}
	return id
}
