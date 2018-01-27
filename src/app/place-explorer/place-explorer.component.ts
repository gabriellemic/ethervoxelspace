import { Component, OnInit } from '@angular/core';
import { ContractService } from '../contract.service';
import { Engine } from '../engine';

@Component({
  selector: 'app-place-explorer',
  templateUrl: './place-explorer.component.html',
  styleUrls: ['./place-explorer.component.css']
})
export class PlaceExplorerComponent implements OnInit {

  constructor(private contractService: ContractService) { }

  ngOnInit() {
    Engine.initialize();

    // this.populateMockWorld();
    this.populateWorldUsingPastEvents();

    this.setUpWatchers();
  }

  setUpWatchers() {
    this.contractService.VoxelPlacedEvent().watch((error, response) => {
      if (error) {
        console.log('EVENT ERROR');
        return;
      }
      console.log('EVENT - VOXEL PLACED: ', response);
      this.spawnVoxelInScene(response.args.x, response.args.y, response.args.z, response.args.material);
    });
    this.contractService.VoxelRepaintedEvent().watch((error, response) => {
      if (error) {
        console.log('EVENT ERROR');
        return;
      }
      console.log('EVENT - VOXEL REPAINTED: ', response);
      this.repaintVoxelInScene(response.args.x, response.args.y, response.args.z, response.args.oldMaterial, response.args.newMaterial);
    });
    this.contractService.VoxelDestroyedEvent().watch((error, response) => {
      if (error) {
        console.log('EVENT ERROR');
        return;
      }
      console.log('EVENT - VOXEL DESTROYED: ', response);
      this.destroyVoxelInScene(response.args.x, response.args.y, response.args.z);
    });
    this.contractService.VoxelTransferredEvent().watch((error, response) => {
      if (error) {
        console.log('EVENT ERROR');
        return;
      }
      console.log('EVENT - VOXEL TRANSFERRED: ', response);
      this.transferVoxelInScene(response.args.to, response.args.x, response.args.y, response.args.z);
    });
  }

  populateMockWorld() {
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        for (let z = 0; z < 16; z++) {
          this.spawnVoxelInScene(x, y, z, 0);
        }
      }
    }
  }

  spawnVoxelInScene(x, y, z, material) {
    if (material > 15) {
      material = 0;
    }
    const mat = new THREE.MeshLambertMaterial({ color: this.contractService.colorArray[material] });
    const voxel = new THREE.Mesh(Engine.geometry, mat);
    Engine.scene.add(voxel);
    voxel.position.set(x, y, z);
    // TODO: set voxel owner address
    // voxel.ownerAddress = ...
    Engine.world[Engine.getVoxelKey(x, y, z)] = voxel; // {v: voxel, o:};
  }

  destroyVoxelInScene(x, y, z) {
    Engine.scene.remove(Engine.world[Engine.getVoxelKey(x, y, z)]);
    delete Engine.world[Engine.getVoxelKey(x, y, z)];
  }

  repaintVoxelInScene(x, y, z, oldMaterial, newMaterial) {
    this.destroyVoxelInScene(x, y, z);
    this.spawnVoxelInScene(x, y, z, newMaterial);
  }

  transferVoxelInScene(to, x, y, z) {
    // Engine.world[Engine.getVoxelKey(x, y, z)]
  }

  populateWorldUsingPastEvents() {
    this.contractService.getWorldFromPastEvents((events) => {
      for (const event of events) {
        if (event.event === 'VoxelPlaced') {
          this.spawnVoxelInScene(event.args.x, event.args.y, event.args.z, event.args.material);
        }
        if (event.event === 'VoxelRepainted') {
          this.repaintVoxelInScene(event.args.x, event.args.y, event.args.z, event.args.oldMaterial, event.args.newMaterial);
        }
        if (event.event === 'VoxelDestroyed') {
          this.destroyVoxelInScene(event.args.x, event.args.y, event.args.z);
        }
      }
    });
  }
}
