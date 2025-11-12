import { Button } from "@/components/ui/button";
import { useProfileConsolidation } from "@/hooks/useProfileConsolidation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const ConsolidateGabrielaProfiles = () => {
  const { consolidateDuplicateProfiles, loading } = useProfileConsolidation();

  const handleConsolidate = async () => {
    await consolidateDuplicateProfiles(
      13, // sourceProfessionalId
      14, // targetProfessionalId
      'c430a9ac-3b64-4ddb-84cd-1bea8e467139', // sourceProfileId
      '393e143c-8f8d-48e3-82e7-5985fc34b412', // targetProfileId
      'https://alopsi-website.s3.amazonaws.com/imagens/fotosPerfil/profile-pictures/gabriela_kumai.jpg' // photoUrl
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consolidar Perfis Duplicados - Gabriela Kumai Mattedi</CardTitle>
        <CardDescription>
          Consolida os 2 perfis da Gabriela em um único perfil mantendo todas as informações
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm space-y-2">
            <p><strong>Perfil a ser mantido (ID 14):</strong></p>
            <ul className="list-disc list-inside ml-4">
              <li>Email: psigabrielamattedi@gmail.com</li>
              <li>10 horários cadastrados</li>
              <li>Serviços e formação normalizados</li>
              <li>Resumo completo</li>
            </ul>
            <p className="mt-2"><strong>Perfil a ser deletado (ID 13):</strong></p>
            <ul className="list-disc list-inside ml-4">
              <li>Email: gabiskm@gmail.com</li>
              <li>Foto de perfil (será transferida)</li>
            </ul>
          </div>
          <Button 
            onClick={handleConsolidate} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Consolidando...' : 'Consolidar Perfis Agora'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
