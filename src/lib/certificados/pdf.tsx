import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

/** Identidade visual Lectiva Edu. */
const AZUL = "#003B73";
const VERDE = "#43A047";
const CINZA = "#6B7280";

export type CertificadoDados = {
  aluno: string;
  curso: string;
  cargaHoraria?: number | null;
  /** Data já formatada (dd/MM/yyyy). */
  data: string;
  codigo: string;
  textoPadrao?: string | null;
  tipo?: string;
};

const styles = StyleSheet.create({
  page: {
    paddingVertical: 56,
    paddingHorizontal: 64,
    fontFamily: "Helvetica",
    color: "#1F2937",
  },
  border: {
    flex: 1,
    borderWidth: 3,
    borderColor: AZUL,
    borderRadius: 6,
    paddingVertical: 40,
    paddingHorizontal: 48,
    justifyContent: "space-between",
  },
  topo: {
    alignItems: "center",
  },
  marca: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: AZUL,
    letterSpacing: 1,
  },
  faixa: {
    marginTop: 4,
    height: 3,
    width: 90,
    backgroundColor: VERDE,
  },
  titulo: {
    marginTop: 28,
    fontSize: 30,
    fontFamily: "Helvetica-Bold",
    color: AZUL,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  subtitulo: {
    marginTop: 6,
    fontSize: 12,
    color: CINZA,
    textAlign: "center",
  },
  corpo: {
    marginTop: 36,
    alignItems: "center",
  },
  intro: {
    fontSize: 13,
    color: "#374151",
    textAlign: "center",
  },
  nome: {
    marginTop: 12,
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: VERDE,
    textAlign: "center",
  },
  texto: {
    marginTop: 18,
    fontSize: 13,
    lineHeight: 1.6,
    color: "#374151",
    textAlign: "center",
  },
  curso: {
    fontFamily: "Helvetica-Bold",
    color: AZUL,
  },
  rodape: {
    marginTop: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  rodapeCol: {
    maxWidth: "60%",
  },
  rotulo: {
    fontSize: 9,
    color: CINZA,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  valor: {
    marginTop: 2,
    fontSize: 11,
    color: "#1F2937",
  },
  codigo: {
    fontFamily: "Helvetica-Bold",
    color: AZUL,
  },
});

/** Documento PDF do certificado (landscape A4). */
export function CertificadoPDF({ dados }: { dados: CertificadoDados }) {
  const textoPadrao =
    dados.textoPadrao?.trim() ||
    `concluiu com aproveitamento o curso ${dados.curso}${
      dados.cargaHoraria ? `, com carga horária total de ${dados.cargaHoraria} horas` : ""
    }.`;

  return (
    <Document
      title={`Certificado — ${dados.aluno}`}
      author="Lectiva Edu"
      subject={dados.curso}
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          <View style={styles.topo}>
            <Text style={styles.marca}>LECTIVA EDU</Text>
            <View style={styles.faixa} />
          </View>

          <View>
            <Text style={styles.titulo}>Certificado</Text>
            <Text style={styles.subtitulo}>
              {dados.tipo ? `Certificado de ${dados.tipo}` : "Certificado de Conclusão"}
            </Text>

            <View style={styles.corpo}>
              <Text style={styles.intro}>Certificamos que</Text>
              <Text style={styles.nome}>{dados.aluno}</Text>
              <Text style={styles.texto}>{textoPadrao}</Text>
            </View>
          </View>

          <View style={styles.rodape}>
            <View style={styles.rodapeCol}>
              <Text style={styles.rotulo}>Código de autenticação</Text>
              <Text style={styles.valor}>
                <Text style={styles.codigo}>{dados.codigo}</Text>
              </Text>
              <Text style={[styles.rotulo, { marginTop: 8 }]}>
                Validação
              </Text>
              <Text style={styles.valor}>lectiva.edu/validar-certificado</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.rotulo}>Data de emissão</Text>
              <Text style={styles.valor}>{dados.data}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

/** Renderiza o certificado e devolve o PDF como Buffer (Node runtime). */
export async function renderCertificadoPDF(dados: CertificadoDados): Promise<Buffer> {
  return renderToBuffer(<CertificadoPDF dados={dados} />);
}
