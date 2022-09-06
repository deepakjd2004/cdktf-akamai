import { Construct } from "constructs";
import { App, TerraformStack, TerraformVariable } from "cdktf";
import * as path from "path"
import { DataAkamaiGroup, DataAkamaiContract, DataAkamaiPropertyRulesTemplate, PropertyActivation, Property, AkamaiProvider, EdgeHostname } from "./.gen/providers/akamai";


class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AkamaiProvider(this, 'provider')

    /**  Start -  Defining input variables  */
    const groupName = new TerraformVariable(this, "groupName", {
      type: "string",
      default: "<groupNameHere>",
      description: "Akamai Group Name for provisioning resources"
    });
    const contractId = new TerraformVariable(this, "contractId", {
      type: "string",
      default: "<contractIdHere>",
      description: "Akamai Contract Id for provisioning resources"
    });
    const productId = new TerraformVariable(this, "productId", {
      type: "string",
      default: "<productIdHere",
      description: "Akamai Product Id for provisioning resources"
    });
    const propertyName = new TerraformVariable(this, "propertyName", {
      type: "string",
      default: "<propertyNameHere>",
      description: "Akamai Property Name"
    });
    const ehnHostname = new TerraformVariable(this, "ehnHostname", {
      type: "string",
      default: "<edgeHostNameHere",
      description: "Akamai EHN hostname"
    });
    /**  End -  Defining input variables  */

   /**  Defining Akamai Group DS */
    const group = new DataAkamaiGroup(this, 'group', {
      groupName:  groupName.value,
      contractId: contractId.value
    })
    /**  Defining Akamai Contract DS */
    const contract = new DataAkamaiContract(this, 'contract', {
      groupName:  group.groupName
    })
    /**  Defining Akamai Property Rule Template DS */
    const propertyRuleTemplate = new DataAkamaiPropertyRulesTemplate(this, 'propertyRuleTemplate',{
      templateFile: path.join(__dirname, 'property-snippets/main.json')
    })

    /**  Defining Akamai EHN Resource */
    const ehn = new EdgeHostname(this, 'ehn', {
      productId:    productId.value,
      contractId:   contract.id,
      groupId:      group.id,
      edgeHostname: ehnHostname.value,
      ipBehavior:   'IPV4'
    })
    /**  Defining Akamai Property Resource */
    const property = new Property(this, 'property',{
      name:         propertyName.value,
      contractId:   contract.id,
      groupId:      group.id,
      productId:    productId.value,
      ruleFormat: 'latest',
      hostnames: [{
        cnameFrom:   "cdktf-demo.akamaidevelopers.com",
        cnameTo:    ehn.edgeHostname,
        certProvisioningType: "CPS_MANAGED"
      }],
      rules: propertyRuleTemplate.json

    })
    /**  Defining Akamai Property Activation Resource */
    new PropertyActivation(this, 'propertyActivation', {
      propertyId: property.id,
      contact: ["<yourEmailIdHere"],
      version: property.latestVersion,
      network: "STAGING",
      note: "Created via. CDK"
    })

  }
}

const app = new App();
new MyStack(app, "akamai");
app.synth();
