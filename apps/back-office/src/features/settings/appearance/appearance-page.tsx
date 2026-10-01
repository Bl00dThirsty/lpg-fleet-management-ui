import { useTheme } from '@/context/theme-provider'
import { useFont } from '@/context/font-provider'
import { fonts } from '@/config/fonts'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function AppearancePage() {
  const { theme, setTheme } = useTheme()
  const { font, setFont } = useFont()

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between space-y-2 mb-4 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Apparence</h2>
      </div>
      
      {/* Container 1 : Apparence et Police */}
      <div className="bg-card shadow-sm rounded-2xl ring-1 ring-black/5 dark:ring-white/5 p-4 sm:p-6 flex flex-col gap-6 sm:gap-8">
        
        {/* Theme Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-start gap-3 sm:gap-4">
          <Label className="text-base sm:mt-2 text-muted-foreground font-medium">Apparence</Label>
          <RadioGroup
            defaultValue={theme}
            onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}
            className="flex flex-row flex-wrap items-center gap-4 sm:gap-6"
          >
            <div className="flex flex-col items-center gap-2">
              <Label
                htmlFor="theme-light"
                className="cursor-pointer border-2 border-transparent [&:has([data-state=checked])]:border-primary rounded-xl p-1 transition-all"
              >
                <RadioGroupItem value="light" id="theme-light" className="sr-only" />
                <div className="items-center rounded-lg ring-1 ring-black/5 p-1 hover:ring-black/15 bg-white/80 transition-all">
                  <div className="space-y-2 rounded-md bg-[#ecedef] p-2">
                    <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-2 w-16 sm:w-20 rounded-lg bg-[#ecedef]" />
                      <div className="h-2 w-[80px] sm:w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[80px] sm:w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[80px] sm:w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                  </div>
                </div>
              </Label>
              <span className="text-sm font-medium">Clair</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Label
                htmlFor="theme-dark"
                className="cursor-pointer border-2 border-transparent [&:has([data-state=checked])]:border-primary rounded-xl p-1 transition-all"
              >
                <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
                <div className="items-center rounded-lg ring-1 ring-white/10 bg-slate-900 p-1 hover:ring-white/20 transition-all">
                  <div className="space-y-2 rounded-md bg-slate-950 p-2">
                    <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-2 w-16 sm:w-20 rounded-lg bg-slate-400" />
                      <div className="h-2 w-[80px] sm:w-[100px] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-slate-400" />
                      <div className="h-2 w-[80px] sm:w-[100px] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-slate-400" />
                      <div className="h-2 w-[80px] sm:w-[100px] rounded-lg bg-slate-400" />
                    </div>
                  </div>
                </div>
              </Label>
              <span className="text-sm font-medium">Sombre</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Label
                htmlFor="theme-system"
                className="cursor-pointer border-2 border-transparent [&:has([data-state=checked])]:border-primary rounded-xl p-1 transition-all"
              >
                <RadioGroupItem value="system" id="theme-system" className="sr-only" />
                <div className="items-center rounded-lg ring-1 ring-black/5 dark:ring-white/10 p-1 hover:ring-black/15 transition-all">
                  <div className="flex h-[88px] sm:h-[92px] w-[116px] sm:w-[130px] overflow-hidden rounded-md bg-[#ecedef]">
                    <div className="w-1/2 bg-[#ecedef] p-2 space-y-2">
                      <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                        <div className="h-2 w-6 sm:w-8 rounded-lg bg-[#ecedef]" />
                      </div>
                      <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                        <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                      </div>
                    </div>
                    <div className="w-1/2 bg-slate-950 p-2 space-y-2">
                      <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                        <div className="h-2 w-6 sm:w-8 rounded-lg bg-slate-400" />
                      </div>
                      <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                        <div className="h-4 w-4 rounded-full bg-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </Label>
              <span className="text-sm font-medium">Auto</span>
            </div>
          </RadioGroup>
        </div>

        {/* Font Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-start sm:items-center gap-2 sm:gap-4">
          <Label className="text-base text-muted-foreground font-medium">Police d'écriture</Label>
          <Select value={font} onValueChange={(v: any) => setFont(v)}>
            <SelectTrigger className="w-full sm:w-[280px] bg-background/50 backdrop-blur-sm">
              <SelectValue placeholder="Sélectionner une police" />
            </SelectTrigger>
            <SelectContent>
              {fonts.map((f) => (
                <SelectItem key={f} value={f}>
                  <span className={`font-${f}`}>{f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Container 2 : Scrollbar Settings */}
      <div className="bg-card shadow-sm rounded-2xl ring-1 ring-black/5 dark:ring-white/5 p-4 sm:p-6 flex flex-col gap-6 sm:gap-8 mt-4 sm:mt-6">
        
        {/* Scrollbar Settings */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <Label className="text-base text-muted-foreground font-medium">Afficher les barres de défilement</Label>
          <RadioGroup defaultValue="auto" className="flex flex-col space-y-2 sm:space-y-3 ml-1">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="auto" id="sb-auto" />
              <Label htmlFor="sb-auto" className="font-normal text-sm sm:text-[15px]">Automatiquement en fonction de la souris</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="scrolling" id="sb-scrolling" />
              <Label htmlFor="sb-scrolling" className="font-normal text-sm sm:text-[15px]">Lors du défilement</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="always" id="sb-always" />
              <Label htmlFor="sb-always" className="font-normal text-sm sm:text-[15px]">Toujours</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4">
          <Label className="text-base text-muted-foreground font-medium">Cliquer dans la barre de défilement pour</Label>
          <RadioGroup defaultValue="next-page" className="flex flex-col space-y-2 sm:space-y-3 ml-1">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="next-page" id="click-next" />
              <Label htmlFor="click-next" className="font-normal text-sm sm:text-[15px]">Aller à la page suivante</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="spot" id="click-spot" />
              <Label htmlFor="click-spot" className="font-normal text-sm sm:text-[15px]">Aller à l'endroit cliqué</Label>
            </div>
          </RadioGroup>
        </div>

      </div>

    </div>
  )
}

