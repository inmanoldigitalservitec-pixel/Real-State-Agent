import { describe, expect, it } from "vitest";
import { ServiceException } from "../../src/lib/errors/service-error";
import { OwnershipValidator } from "../../src/services/ownership-validator";

describe("OwnershipValidator", () => {
  it("rejects foreign property ownership", async () => {
    const validator = new OwnershipValidator(
      {
        async findConversationById() {
          return {
            id: "conversation",
            company_id: "company-1"
          };
        }
      } as never,
      {
        async findById() {
          return {
            property: {
              id: "property",
              company_id: "company-2"
            }
          };
        }
      } as never
    );

    await expect(
      validator.validate({
        companyId: "company-1",
        propertyId: "property"
      })
    ).rejects.toBeInstanceOf(ServiceException);
  });
});
