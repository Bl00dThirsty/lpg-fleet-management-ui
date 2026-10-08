import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { DeliveryTour, Checkpoint } from '@lpg/types'
import { useAuthStore } from '@/store/auth-store'
import { useToursStore } from '@/store/tours-store'
import { MissionQuantityEditor } from './mission-quantity-editor'
const tour = {id:'inline-tour',status:'PLANNED',execution_mode:'INTERNAL',type:'BOUTEILLES50KG',marketeur_org_id:'org',requested_quantity:20,created_by:'planner'} as DeliveryTour
const checkpoints = [{id:'source',sequence:1,site_id:'depot',expected_quantity:20},{id:'stop',sequence:2,client_site_id:'client',expected_quantity:20}] as Checkpoint[]
async function setup() { return render(<QueryClientProvider client={new QueryClient({defaultOptions:{mutations:{retry:false}}})}><MissionQuantityEditor tourId={tour.id} checkpointId='stop' value={20} /><button>Hors du champ</button></QueryClientProvider>) }
beforeEach(()=>{useAuthStore.setState({user:{id:'planner',email:'test@example.com',first_name:'Test',last_name:'Test',system_role:'MARKETEUR',org_id:'org'}});useToursStore.setState({tours:[tour]});vi.spyOn(useToursStore.getState(),'fetchCheckpoints').mockResolvedValue(checkpoints)})
afterEach(()=>{vi.restoreAllMocks();useAuthStore.setState({user:null})})
describe('inline quantity editing',()=>{
 it('rejects fractional bottles inline without a mutation',async()=>{const save=vi.spyOn(useToursStore.getState(),'updateTourAsync');const screen=await setup();await userEvent.click(screen.getByRole('button',{name:'Modifier la quantité'}));await userEvent.fill(screen.getByLabelText('Quantité (btl)'),'2.5');await userEvent.click(screen.getByRole('button',{name:'Enregistrer la quantité'}));await expect.element(screen.getByText('Le nombre de bouteilles doit être entier.')).toBeInTheDocument();expect(save).not.toHaveBeenCalled()})
 it('saves once on blur and rolls back an optimistic value on server rejection',async()=>{let reject!: (error:Error)=>void;const save=vi.spyOn(useToursStore.getState(),'updateTourAsync').mockImplementation(()=>new Promise((_,fail)=>{reject=fail}));const feedback=vi.spyOn(toast,'error');const screen=await setup();await userEvent.click(screen.getByRole('button',{name:'Modifier la quantité'}));await userEvent.fill(screen.getByLabelText('Quantité (btl)'),'30');await userEvent.click(screen.getByRole('button',{name:'Hors du champ'}));await expect.element(screen.getByRole('button',{name:'Modifier la quantité'})).toHaveTextContent('30 btl');await expect.poll(()=>save.mock.calls.length).toBe(1);reject(new Error('Refus serveur'));await expect.element(screen.getByRole('button',{name:'Modifier la quantité'})).toHaveTextContent('20 btl');expect(feedback).toHaveBeenCalledOnce()})
 it('cancels without saving',async()=>{const save=vi.spyOn(useToursStore.getState(),'updateTourAsync');const screen=await setup();await userEvent.click(screen.getByRole('button',{name:'Modifier la quantité'}));await userEvent.fill(screen.getByLabelText('Quantité (btl)'),'30');await userEvent.click(screen.getByRole('button',{name:'Annuler la modification'}));await expect.element(screen.getByRole('button',{name:'Modifier la quantité'})).toHaveTextContent('20 btl');expect(save).not.toHaveBeenCalled()})
 it('disables editing once the mission has started',async()=>{useToursStore.setState({tours:[{...tour,status:'INPROGRESS'}]});const screen=await setup();await expect.element(screen.getByRole('button',{name:'Quantité prévue'})).toBeDisabled()})
})
