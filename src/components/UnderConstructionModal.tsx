import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Construction, X } from "lucide-react"

interface UnderConstructionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  message?: string
  tenantName: string
}

export const UnderConstructionModal = ({
  open,
  onOpenChange,
  title,
  message,
  tenantName,
}: UnderConstructionModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Construction className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
            </div>
            <DialogTitle className="text-xl">
              {title || `${tenantName} em Construção`}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            {message || `O site ${tenantName} está temporariamente indisponível enquanto realizamos melhorias. Agradecemos sua compreensão!`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="default"
            onClick={() => onOpenChange(false)}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
